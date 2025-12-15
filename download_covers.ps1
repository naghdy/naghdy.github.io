$ErrorActionPreference = "Stop"
$csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRO-DmKFr8w-VvQPBiQIuqGmHfDzDfCT6bjA63_0r2vkz8SOTv0t-cdw9PEDWzEpy08Vx9yUD_M6AiM/pub?gid=0&single=true&output=csv"
$outputDir = "images/covers"

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

Write-Host "Fetching CSV..."
$response = Invoke-WebRequest -Uri $csvUrl -UseBasicParsing
$csvText = $response.Content
$books = $csvText | ConvertFrom-Csv

foreach ($book in $books) {
    # Clean ISBN
    $isbn13 = $book.ISBN13 -replace '["=]', '' -replace '[^0-9X]', ''
    $isbn10 = $book.ISBN -replace '["=]', '' -replace '[^0-9X]', ''
    $isbn = if ($isbn13) { $isbn13 } else { $isbn10 }
    
    $title = $book.Title
    # If no ISBN, we still want to try Title Search, but we need a filename. 
    # Use sanitized title if ISBN matches nothing? 
    # Current index.html expects ISBN.jpg logic. 
    # If we switch to Title search, we might save as ISBN.jpg anyway if we have an ISBN, 
    # or skip if we have absolutely no identifier? 
    # Let's assume we have ISBN but it failed, OR we rely on ISBN for filename.
    
    if ([string]::IsNullOrWhiteSpace($isbn) -or $isbn.Length -lt 10) { 
        Write-Host "Skipping (No ISBN): $title"
        continue 
    }

    $targetPath = Join-Path $outputDir "$isbn.jpg"
    
    if (Test-Path $targetPath) {
        if ((Get-Item $targetPath).Length -gt 1000) {
            Write-Host "Skipping (Exists): $title"
            continue
        }
    }
    
    Write-Host "Processing: $title..."
    $downloaded = $false
    
    # 1. OpenLibrary (ISBN)
    try {
        $olUrl = "https://covers.openlibrary.org/b/isbn/$isbn-M.jpg?default=false"
        Invoke-WebRequest -Uri $olUrl -OutFile $targetPath -ErrorAction Stop
        if ((Get-Item $targetPath).Length -gt 100) { $downloaded = $true }
    } catch {}

    # 2. Google Books (ISBN)
    if (-not $downloaded) {
        try {
             $gUrl = "https://www.googleapis.com/books/v1/volumes?q=isbn:$isbn"
             $gRes = Invoke-WebRequest -Uri $gUrl -UseBasicParsing
             $gJson = $gRes.Content | ConvertFrom-Json
             $thumb = $gJson.items[0].volumeInfo.imageLinks.thumbnail
             if ($thumb) {
                 $thumb = $thumb -replace 'http://', 'https://'
                 Invoke-WebRequest -Uri $thumb -OutFile $targetPath
                 $downloaded = $true
                 Write-Host "  -> Found via ISBN (Google)"
             }
        } catch {}
    }

    # 3. Amazon (ISBN/ASIN)
    if (-not $downloaded) {
         try {
             $asin = $isbn -replace '-', ''
             $amzUrl = "https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg"
             Invoke-WebRequest -Uri $amzUrl -OutFile $targetPath
             if ((Get-Item $targetPath).Length -lt 100) { Remove-Item $targetPath } 
             else { $downloaded = $true; Write-Host "  -> Found via ISBN (Amazon)" }
         } catch {}
    }

    # 4. Fallback: Google Books TITLE Search
    # "Get the first image, that should cover 99% of cases"
    if (-not $downloaded) {
        try {
            Write-Host "  -> Attempting Title Match..."
            # Encode title
            $encodedTitle = [System.Web.HttpUtility]::UrlEncode($title)
            # Use 'intitle' for better precision
            $searchUrl = "https://www.googleapis.com/books/v1/volumes?q=intitle:$encodedTitle&maxResults=1"
            $sRes = Invoke-WebRequest -Uri $searchUrl -UseBasicParsing
            $sJson = $sRes.Content | ConvertFrom-Json
            
            if ($sJson.items -and $sJson.items.Count -gt 0) {
                 $thumb = $sJson.items[0].volumeInfo.imageLinks.thumbnail
                 if ($thumb) {
                     $thumb = $thumb -replace 'http://', 'https://'
                     Invoke-WebRequest -Uri $thumb -OutFile $targetPath
                     $downloaded = $true
                     Write-Host "  -> Found via TITLE MATCH!"
                 }
            }
        } catch {
             Write-Host "     Error during title search: $_"
        }
    }
    
    if (-not $downloaded) { Write-Host "  -> Still no cover found." }
}
Write-Host "Done."
