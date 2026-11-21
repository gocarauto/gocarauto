#!/usr/bin/env python3
import os
import shutil
from PIL import Image

RAW_DIR = "/home/akhalil/SSD/AntiGravity/GoCar Auto/sketches-raw"
TARGET_DIRS = [
    "/home/akhalil/SSD/AntiGravity/GoCar Auto/customer-portal/public/sketches",
    "/home/akhalil/SSD/AntiGravity/GoCar Auto/staff-interface/public/sketches",
    "/home/akhalil/SSD/AntiGravity/GoCar Auto/customer-portal/dist/sketches",
    "/home/akhalil/SSD/AntiGravity/GoCar Auto/staff-interface/dist/sketches",
]

MAPPING = {
    '1999 Daewoo Lanos (T100 Sedan).jpg': ['daewoo-lanos-1999', 'daewoo-lanos'],
    '2000 Mitsubishi Colt CJ0 (5th Gen Hatchback).jpg': ['mitsubishi-colt-2000', 'mitsubishi-colt'],
    '2002 Mercedes C200 (W203 Sedan).jpg': ['mercedes-c200-2002', 'mercedes-benz-c200-2002', 'mercedes-c200'],
    '2005 Hyundai Matrix FC (Pre-facelift Mini MPV).jpg': ['hyundai-matrix-2005', 'hyundai-matrix-2009', 'hyundai-matrix-2011', 'hyundai-matrix'],
    '2007 Daihatsu Terios J200 (2nd Gen SUV).jpg': ['daihatsu-terrios-2007', 'daihatsu-terios-2007', 'daihatsu-terrios', 'daihatsu-terios'],
    '2007 Proton Waja CF1S Sedan .jpg': ['proton-waga-2007', 'proton-waja-2007', 'proton-waga', 'proton-waja'],
    '2007 Toyota Yaris Sedan (XP90  Belta).jpg': ['toyota-yaris-2007', 'toyota-yaris-2008', 'toyota-yaris'],
    '2007 Volkswagen Jetta Mk5 (A5 Sedan).jpg': ['volkswagen-jetta-2007', 'volkswagen-jetta-2008', 'volkswagen-jetta'],
    '2008 Honda Civic (8th Gen, FD Sedan).jpg': ['honda-civic-2008', 'honda-civic'],
    '2008 Hyundai Verna (LC - MC Sedan, generation MC).jpg': ['hyundai-verna-2008', 'hyundai-verna-2010', 'hyundai-verna'],
    '2008 Hyundai i10 PA (1st Gen City Car - Hatchback).jpg': ['hyundai-i10-2008', 'hyundai-i10'],
    '2008 Mitsubishi Lancer EX (CY0, "Shark" generation) Sedan.jpg': ['mitsubishi-lancer-2008', 'mitsubishi-lancer-2009', 'mitsubishi-lancer-2015', 'mitsubishi-lancer-2017', 'mitsubishi-lancer'],
    '2008 Toyota Corolla E140 (10th Gen Sedan).jpg': ['toyota-corolla-2008', 'toyota-corolla-2010', 'toyota-corolla-2012'],
    '2009 Ford Focus Mk2.5 (Facelift Hatchback).jpg': ['ford-focus-2009', 'ford-focus-2012', 'ford-focus'],
    '2010 Nissan Livina L10 (1st Gen Compact MPV).jpg': ['nissan-livina-2010', 'nissan-livina'],
    '2010 Renault Logan 1st Gen (Phase 2 Sedan).jpg': ['renault-logan-2010'],
    '2011 Hyundai Elantra (5th Gen, MD Sedan).jpg': ['hyundai-elantra-2011', 'hyundai-elantra-2013', 'hyundai-elentra-2011', 'hyundai-elentra-2013'],
    '2011 Nissan Blue Bird Sylphy G11 Sedan .jpg': ['nissan-blue-bird-2011', 'nissan-bluebird-2011', 'nissan-blue-bird'],
    '2011 Nissan Sunny N16 (EX Saloon).jpg': ['nissan-sunny-2011', 'nissan-sunny-n16-2011', 'nissan-sunny'],
    '2013 Chevrolet Aveo T250 (Facelift Sedan).jpg': ['chevrolet-aveo-2013', 'chevrolet-aveo'],
    '2013 Proton Gen 2 CM Liftback.jpg': ['proton-gen-2-2013', 'proton-gen-2'],
    '2013 Proton Saga BLM FLX Sedan.jpg': ['proton-saga-2013', 'proton-saga'],
    '2013 Renault Logan 2nd Gen (L52 Sedan).jpg': ['renault-logan-2013', 'renault-logan'],
    '2013 Toyota Corolla E150 E170 (11th Gen).jpg': ['toyota-corolla-2013'],
    '2013 Volkswagen Passat B7 (Typ 3C Sedan).jpg': ['volkswagen-passat-2013', 'volkswagen-passat'],
    '2015 Geely Pandino (LC - GX2 Cross).jpg': ['geely-pandino-2015', 'geely-pandino'],
    '2015 Hyundai Accent RB (4th Gen Sedan).jpg': ['hyundai-accent-rb-2015', 'hyundai-accent-rb-2017', 'hyundai-accent-2015', 'hyundai-accent-2017', 'hyundai-accent-rb'],
    '2015 Hyundai Solaris (RB Sedan).jpg': ['hyundai-solaris-2015', 'hyundai-solaris'],
    '2015 Mazda 3 BM (3rd Gen Sedan).jpg': ['mazda-3-2015', 'mazda-3'],
    '2015 Opel Insignia Insignia A (Facelift Sedan).jpg': ['opel-insignia-2015', 'opel-insignia'],
    '2015 Renault Fluence L38 (Facelift Sedan).jpg': ['renault-fluence-2015', 'renault-fluence'],
    '2016 Citroën C-Elysée (1st Gen, Phase 1).jpg': ['citroen-c-elysee-2016', 'citroen-c-elysee'],
    '2016 Hyundai Tucson ix35 (LM-TL Crossover).jpg': ['hyundai-tucson-ix35-2016', 'hyundai-tucson-2016', 'hyundai-ix35-2016', 'hyundai-tucson-ix35', 'hyundai-tucson'],
    '2016 Skoda Octavia Octavia A7  Mk3 (5E Sedan).jpg': ['skoda-octavia-2016', 'skoda-octavia'],
    '2016 SsangYong Tivoli X100 Compact SUV.jpg': ['ssangyong-tivoli-2016', 'ssangyong-tivoli'],
    '2017 Hyundai Elantra HD (4th Gen, HD Sedan).jpg': ['hyundai-elentra-hd-2017', 'hyundai-elantra-hd-2017', 'hyundai-elentra-hd', 'hyundai-elantra-hd'],
    '2018 Subaru XV GT (2nd Gen Crossover).jpg': ['subaru-xv-2018', 'subaru-xv'],
    '2019 Toyota Corolla E210 (12th Gen Sedan).jpg': ['toyota-corolla-2019', 'toyota-corolla'],
    '2020 Citroen C5 Aircross (Phase 1, Compact Crossover).jpg': ['citroen-c5-aircross-2020', 'citroen-c5-aircross'],
    '2021 Renault Megane 4 Megane IV (GrandCoupe Sedan).jpg': ['renault-megane-4-2021', 'renault-megane-2021', 'renault-megane-4', 'renault-megane'],
    '2022 Hyundai Elantra (7th Gen, CN7 Sedan).jpg': ['hyundai-elentra-2022', 'hyundai-elantra-2022', 'hyundai-elentra', 'hyundai-elantra'],
    '2023 Kia Cerato BD (4th Gen Facelift, also known as Grand Cerato) Sedan.jpg': ['kia-cerato-2023', 'kia-cerato'],
    '2025 Soueast S05 Compact Crossover.jpg': ['soueast-s05-2025', 'soueast-s05']
}

for d in TARGET_DIRS:
    os.makedirs(d, exist_ok=True)

print(f"Processing {len(MAPPING)} master vehicle sketches...")
total_raw_bytes = 0
total_webp_bytes = 0
total_png_bytes = 0

TEMP_OUTPUT = "/tmp/processed_sketches"
os.makedirs(TEMP_OUTPUT, exist_ok=True)

processed_files = []

for raw_filename, slugs in MAPPING.items():
    raw_path = os.path.join(RAW_DIR, raw_filename)
    if not os.path.exists(raw_path):
        print(f"WARNING: File not found: {raw_path}")
        continue

    raw_size = os.path.getsize(raw_path)
    total_raw_bytes += raw_size

    with Image.open(raw_path) as img:
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # High-DPI retina display resolution: 1200 x 896 (Lanczos filter)
        resized = img.resize((1200, 896), Image.Resampling.LANCZOS)

        # Primary slug
        primary_slug = slugs[0]
        primary_webp = os.path.join(TEMP_OUTPUT, f"{primary_slug}.webp")
        primary_png = os.path.join(TEMP_OUTPUT, f"{primary_slug}.png")

        resized.save(primary_webp, format="WEBP", quality=88, method=6)
        resized.save(primary_png, format="PNG", optimize=True)

        webp_size = os.path.getsize(primary_webp)
        png_size = os.path.getsize(primary_png)
        total_webp_bytes += webp_size
        total_png_bytes += png_size

        print(f"✓ {primary_slug}: {raw_size // 1024} KB -> WebP: {webp_size // 1024} KB | PNG: {png_size // 1024} KB")

        # For all other alias slugs, copy the primary webp and png
        for alias in slugs:
            alias_webp = os.path.join(TEMP_OUTPUT, f"{alias}.webp")
            alias_png = os.path.join(TEMP_OUTPUT, f"{alias}.png")
            if alias_webp != primary_webp:
                shutil.copyfile(primary_webp, alias_webp)
            if alias_png != primary_png:
                shutil.copyfile(primary_png, alias_png)
            processed_files.extend([f"{alias}.webp", f"{alias}.png"])

print("\nDeploying processed sketches to target directories...")
unique_files = sorted(list(set(processed_files)))
for d in TARGET_DIRS:
    for fname in unique_files:
        src_file = os.path.join(TEMP_OUTPUT, fname)
        dst_file = os.path.join(d, fname)
        shutil.copyfile(src_file, dst_file)
    print(f"  -> Deployed {len(unique_files)} files to {d}")

print("\n=== COMPRESSION SUMMARY ===")
print(f"Total Raw Originals: {total_raw_bytes / (1024 * 1024):.2f} MB")
print(f"Total Master WebP:   {total_webp_bytes / (1024 * 1024):.2f} MB ({(1 - total_webp_bytes/total_raw_bytes)*100:.1f}% reduction)")
print(f"Total Master PNG:    {total_png_bytes / (1024 * 1024):.2f} MB ({(1 - total_png_bytes/total_raw_bytes)*100:.1f}% reduction)")
print("Processing complete!")
