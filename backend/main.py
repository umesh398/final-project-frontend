from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.concurrency import run_in_threadpool
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from pathlib import Path
import uuid
import math
import asyncio
import aiofiles
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import List, Optional
import shutil
from PIL import Image
import io

app = FastAPI()

# ---------------- CONFIG ----------------
# Use ThreadPoolExecutor for CPU-bound tasks
executor = ThreadPoolExecutor(max_workers=4)

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# ---------------- PATHS ----------------
BASE_DIR = Path("data")
PDF_DIR = BASE_DIR / "pdfs"
IMG_DIR = BASE_DIR / "images"
TEMP_DIR = BASE_DIR / "temp"

# Create directories
for dir_path in [PDF_DIR, IMG_DIR, TEMP_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# ---------------- OPTIMIZED PDF BUILDER ----------------
def build_pdf_optimized(
    pdf_path: str,
    ship_name: str,
    date: str,
    inspector: str,
    port: str,
    ship_type: str,
    images: List[str],
    descriptions: List[str],
    images_per_page: int,
    logo_path: Optional[str] = None,
    ship_image_path: Optional[str] = None
):
    """Optimized PDF generation with better memory management"""
    width, height = A4
    c = canvas.Canvas(pdf_path, pagesize=A4)
    
    # Pre-process images in parallel
    processed_images = []
    for img_path in images:
        try:
            # Optimize images before adding to PDF
            with Image.open(img_path) as img:
                # Resize if too large
                max_size = (800, 600)
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Save as optimized JPEG
                output = io.BytesIO()
                img.convert('RGB').save(output, format='JPEG', quality=85, optimize=True)
                output.seek(0)
                processed_images.append(output)
        except Exception as e:
            print(f"Error processing image {img_path}: {e}")
            processed_images.append(img_path)  # Fallback to original
    
    total_pages = 1 + math.ceil(len(images) / images_per_page)
    page_no = 1

    # ========== PAGE 1 ==========
    y = height - 40
    
    # Logo - optimized drawing
    if logo_path:
        try:
            with Image.open(logo_path) as img:
                # Resize logo
                img.thumbnail((70, 70), Image.Resampling.LANCZOS)
                output = io.BytesIO()
                img.convert('RGB').save(output, format='JPEG', quality=90)
                output.seek(0)
                c.drawImage(ImageReader(output), 40, y - 60, 70, 70, preserveAspectRatio=True)
        except:
            c.drawImage(logo_path, 40, y - 60, 70, 70, preserveAspectRatio=True)

    # Ship name
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, y, ship_name[:50])  # Limit length

    # Date
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 40, y, f"Date: {date}")

    # Inspector bar - simplified
    y -= 90
    c.setFillColorRGB(0.18, 0.38, 0.60)
    c.roundRect(40, y, width - 80, 32, 6, fill=1)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(55, y + 10, inspector[:40])  # Limit length
    c.setFillColorRGB(0, 0, 0)

    # Port & Ship type
    y -= 55
    c.setFont("Helvetica", 11)
    c.drawString(40, y, f"Port: {port[:30]}")
    y -= 18
    c.drawString(40, y, f"Ship Type: {ship_type[:30]}")

    # Ship image - optimized
    if ship_image_path:
        c.roundRect(width - 260, height - 330, 220, 160, 6)
        try:
            with Image.open(ship_image_path) as img:
                img.thumbnail((210, 150), Image.Resampling.LANCZOS)
                output = io.BytesIO()
                img.convert('RGB').save(output, format='JPEG', quality=85)
                output.seek(0)
                c.drawImage(ImageReader(output), width - 255, height - 325, 210, 150, preserveAspectRatio=True)
        except:
            c.drawImage(ship_image_path, width - 255, height - 325, 210, 150, preserveAspectRatio=True)

    # Footer
    c.setFont("Helvetica-Oblique", 9)
    c.drawCentredString(width / 2, 30, "Powered by Fathom Marine")
    c.drawRightString(width - 40, 30, f"Page {page_no} of {total_pages}")
    
    c.showPage()
    page_no += 1

    # ========== IMAGE PAGES ==========
    cols = 2
    rows = images_per_page // 2
    img_w = (width - 80) / cols
    img_h = (height - 120) / rows

    # Batch process images per page
    for page_start in range(0, len(processed_images), images_per_page):
        c.setFont("Helvetica-Oblique", 9)
        c.drawCentredString(width / 2, 30, "Powered by Fathom Marine")
        c.drawRightString(width - 40, 30, f"Page {page_no} of {total_pages}")
        
        page_images = processed_images[page_start:page_start + images_per_page]
        page_descriptions = descriptions[page_start:page_start + images_per_page]
        
        for idx, (img_data, desc) in enumerate(zip(page_images, page_descriptions)):
            col = idx % 2
            row = idx // 2
            x = 40 + col * img_w
            y = height - 60 - (row + 1) * img_h
            
            c.roundRect(x, y, img_w - 10, img_h - 10, 6)
            
            try:
                c.drawImage(
                    ImageReader(img_data) if isinstance(img_data, io.BytesIO) else img_data,
                    x + 5,
                    y + 35,
                    img_w - 20,
                    img_h - 55,
                    preserveAspectRatio=True
                )
            except Exception as e:
                print(f"Error drawing image: {e}")
            
            if desc:
                c.setFont("Helvetica", 8)
                # Truncate long descriptions
                if len(desc) > 50:
                    desc = desc[:47] + "..."
                c.drawString(x + 8, y + 15, desc)
        
        c.showPage()
        page_no += 1
    
    c.save()

# ---------------- ASYNC FILE HANDLING ----------------
async def save_upload_file(upload_file: UploadFile, destination: Path) -> Path:
    """Asynchronously save uploaded file"""
    try:
        async with aiofiles.open(destination, "wb") as buffer:
            content = await upload_file.read()
            await buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
    return destination

async def cleanup_temp_files(file_paths: List[Path]):
    """Clean up temporary files asynchronously"""
    for file_path in file_paths:
        try:
            if file_path.exists():
                file_path.unlink()
        except Exception as e:
            print(f"Error cleaning up {file_path}: {e}")

# ---------------- CREATE INSPECTION ----------------
@app.post("/inspection")
async def create_inspection(
    background_tasks: BackgroundTasks,
    ship_name: str = Form(...),
    date: str = Form(...),
    inspector: str = Form(...),
    port: str = Form(...),
    ship_type: str = Form(...),
    images_per_page: int = Form(...),
    logo: UploadFile = File(None),
    ship_image: UploadFile = File(None),
    images: List[UploadFile] = File(...),
    descriptions: List[str] = Form(...)
):
    # Validation
    if images_per_page % 2 != 0 or images_per_page < 2 or images_per_page > 8:
        raise HTTPException(status_code=400, detail="images_per_page must be EVEN between 2 and 8")
    
    if len(images) != len(descriptions):
        raise HTTPException(status_code=400, detail="Number of images and descriptions must match")
    
    if len(images) > 100:  # Limit max images
        raise HTTPException(status_code=400, detail="Maximum 100 images allowed")
    
    inspection_id = str(uuid.uuid4())[:8]
    pdf_path = PDF_DIR / f"{inspection_id}.pdf"
    
    # Track files for cleanup
    temp_files = []
    
    try:
        # Save files concurrently
        save_tasks = []
        
        # Save logo if provided
        logo_path = None
        if logo:
            logo_path = TEMP_DIR / f"logo_{uuid.uuid4()}_{logo.filename}"
            save_tasks.append(save_upload_file(logo, logo_path))
            temp_files.append(logo_path)
        
        # Save ship image if provided
        ship_img_path = None
        if ship_image:
            ship_img_path = TEMP_DIR / f"ship_{uuid.uuid4()}_{ship_image.filename}"
            save_tasks.append(save_upload_file(ship_image, ship_img_path))
            temp_files.append(ship_img_path)
        
        # Save inspection images
        saved_image_paths = []
        for img in images:
            img_path = TEMP_DIR / f"img_{uuid.uuid4()}_{img.filename}"
            save_tasks.append(save_upload_file(img, img_path))
            saved_image_paths.append(img_path)
            temp_files.append(img_path)
        
        # Wait for all files to save
        await asyncio.gather(*save_tasks)
        
        # Generate PDF in thread pool (CPU-bound task)
        await run_in_threadpool(
            build_pdf_optimized,
            pdf_path=str(pdf_path),
            ship_name=ship_name,
            date=date,
            inspector=inspector,
            port=port,
            ship_type=ship_type,
            images=[str(p) for p in saved_image_paths],
            descriptions=descriptions,
            images_per_page=images_per_page,
            logo_path=str(logo_path) if logo_path else None,
            ship_image_path=str(ship_img_path) if ship_img_path else None
        )
        
        # Schedule cleanup of temp files
        background_tasks.add_task(cleanup_temp_files, temp_files)
        
        return JSONResponse({
            "inspection_id": inspection_id,
            "download_url": f"/export/{inspection_id}",
            "status": "success",
            "message": f"Inspection report generated with {len(images)} images"
        })
        
    except Exception as e:
        # Clean up on error
        await cleanup_temp_files(temp_files)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

# ---------------- DOWNLOAD PDF ----------------
@app.get("/export/{inspection_id}")
async def download_pdf(inspection_id: str):
    """Download generated PDF"""
    pdf = PDF_DIR / f"{inspection_id}.pdf"
    
    if not pdf.exists():
        raise HTTPException(status_code=404, detail="PDF not found")
    
    return FileResponse(
        path=pdf,
        media_type="application/pdf",
        filename=f"inspection_{inspection_id}.pdf",
        headers={
            "Content-Disposition": f'attachment; filename="inspection_{inspection_id}.pdf"'
        }
    )

# ---------------- HEALTH CHECK ----------------
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "pdf_dir_free": shutil.disk_usage(PDF_DIR).free,
        "temp_files": len(list(TEMP_DIR.glob("*")))
    }

# ---------------- CLEANUP OLD FILES ----------------
@app.on_event("startup")
async def startup_event():
    """Clean old temp files on startup"""
    import time
    now = time.time()
    for f in TEMP_DIR.glob("*"):
        if now - f.stat().st_mtime > 3600:  # Older than 1 hour
            f.unlink()
    for f in PDF_DIR.glob("*.pdf"):
        if now - f.stat().st_mtime > 86400:  # Older than 24 hours
            f.unlink()