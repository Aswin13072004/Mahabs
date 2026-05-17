import os
import json
import sys

def get_file_info(filepath):
    """
    Reads magic bytes to determine file type.
    Returns (type, ext) or (None, None)
    """
    try:
        with open(filepath, 'rb') as f:
            header = f.read(12)
            
            # JPEG: FF D8 FF
            if header.startswith(b'\xff\xd8\xff'):
                return 'image', '.jpg'
                
            # PNG: 89 50 4E 47 0D 0A 1A 0A
            if header.startswith(b'\x89PNG\r\n\x1a\n'):
                return 'image', '.png'
                
            # WEBP: RIFF .... WEBP
            if header.startswith(b'RIFF') and header[8:12] == b'WEBP':
                return 'image', '.webp'
                
            # MP4: .... ftyp
            if b'ftyp' in header:
                # If it's ftypqt, it's mov, otherwise assume mp4
                if b'ftypqt' in header:
                    return 'video', '.mov'
                return 'video', '.mp4'
                
            # WEBM: 1A 45 DF A3
            if header.startswith(b'\x1aE\xdf\xa3'):
                return 'video', '.webm'
                
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        
    return None, None

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    photos_dir = os.path.join(base_dir, 'photos')
    output_file = os.path.join(base_dir, 'photos.json')
    
    if not os.path.exists(photos_dir):
        print(f"Error: Directory not found at {photos_dir}")
        sys.exit(1)
        
    media_files = []

    print("Scanning for extensionless media files...")
    for filename in os.listdir(photos_dir):
        filepath = os.path.join(photos_dir, filename)
        
        # Only process files that are 32 chars long (MD5 hash) and have no extension
        if len(filename) == 32 and os.path.isfile(filepath):
            media_type, ext = get_file_info(filepath)
            if media_type and ext:
                media_files.append({
                    "id": filename,
                    "type": media_type,
                    "ext": ext
                })
            
    # Sort for consistency
    media_files.sort(key=lambda x: x['id'])
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(media_files, f, indent=2)
        
    print(f"Successfully generated photos.json with {len(media_files)} files.")

if __name__ == "__main__":
    main()
