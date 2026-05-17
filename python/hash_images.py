import os
import hashlib
import sys

def get_file_hash(filepath):
    """Generate MD5 hash of a file's binary contents."""
    hasher = hashlib.md5()
    try:
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    photos_dir = os.path.join(base_dir, 'photos')
    
    if not os.path.exists(photos_dir):
        print(f"Error: Directory not found at {photos_dir}")
        sys.exit(1)
        
    valid_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov'}
    renamed_count = 0
    skipped_count = 0

    print("Scanning for files to hash...")
    for filename in os.listdir(photos_dir):
        filepath = os.path.join(photos_dir, filename)
        
        # If it's a directory, skip
        if not os.path.isfile(filepath):
            continue
            
        ext = os.path.splitext(filename)[1].lower()
        
        # Check if already hashed (32 chars md5 + NO extension)
        if len(filename) == 32 and all(c in '0123456789abcdef' for c in filename.lower()):
            skipped_count += 1
            continue
            
        # Only process if it has a valid extension (unprocessed file)
        if ext not in valid_extensions:
            continue
            
        file_hash = get_file_hash(filepath)
        if not file_hash:
            continue
            
        # The new filename is JUST the hash, no extension
        new_filename = file_hash
        new_filepath = os.path.join(photos_dir, new_filename)
        
        if os.path.exists(new_filepath) and filepath != new_filepath:
            print(f"Duplicate content found. Removing {filename} as {new_filename} already exists.")
            os.remove(filepath)
            continue
            
        if filepath != new_filepath:
            os.rename(filepath, new_filepath)
            print(f"Renamed: {filename} -> {new_filename} (Extension removed)")
            renamed_count += 1
            
    print(f"\nDone! Renamed: {renamed_count}, Skipped (already hashed): {skipped_count}")

if __name__ == "__main__":
    main()
