/**
 * Script to download book covers for offline use.
 * 
 * Instructions:
 * 1. Ensure you have Node.js installed.
 * 2. Run: npm install node-fetch fs
 * 3. Run: node download_covers.js
 * 
 * This script will:
 * - Read local 'updated_books.csv'
 * - Parse ISBN and ISBN13
 * - Download covers from OpenLibrary/GoogleBooks for ALL valid IDs found
 * - Save them to 'images/covers/'
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Local CSV file path
const LOCAL_CSV_PATH = './updated_books.csv';
const OUTPUT_DIR = './images/covers';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log("Reading local CSV...");

async function run() {
    try {
        if (!fs.existsSync(LOCAL_CSV_PATH)) {
            console.error(`File not found: ${LOCAL_CSV_PATH}`);
            return;
        }

        const text = fs.readFileSync(LOCAL_CSV_PATH, 'utf-8');
        const lines = text.split('\n').slice(1); // Skip header

        for (const line of lines) {
            if (!line.trim()) continue;

            const cols = parseCSVLine(line);
            // Index 5 = ISBN, Index 6 = ISBN13
            // Clean both identifiers
            const rawIsbn = cols[5] ? cols[5].replace(/["=]/g, '').replace(/[^0-9X]/g, '') : '';
            const rawIsbn13 = cols[6] ? cols[6].replace(/["=]/g, '').replace(/[^0-9X]/g, '') : '';

            // Create a set of unique, valid ISBNs to try
            const isbnsToTry = new Set();
            if (rawIsbn.length >= 10) isbnsToTry.add(rawIsbn);
            if (rawIsbn13.length >= 10) isbnsToTry.add(rawIsbn13);

            const title = cols[1] || "Unknown Title";

            if (isbnsToTry.size > 0) {
                console.log(`Processing ${title}...`);
                for (const isbn of isbnsToTry) {
                    await downloadCover(isbn);
                }
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
        else current += char;
    }
    values.push(current.trim());
    return values;
}

async function downloadCover(isbn) {
    const filePath = path.join(OUTPUT_DIR, `${isbn}.jpg`);
    if (fs.existsSync(filePath)) {
        // console.log(`  -> Exists: ${isbn}`); 
        return;
    }

    console.log(`  -> Downloading ${isbn}...`);

    // Try OpenLibrary
    const olUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    if (await downloadFile(olUrl, filePath)) {
        console.log(`     [OK] OpenLibrary`);
        return;
    }

    // Try Google Books
    try {
        const gRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
        const gData = await gRes.json();
        const link = gData.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
        if (link) {
            if (await downloadFile(link.replace('http:', 'https:'), filePath)) {
                console.log(`     [OK] GoogleBooks`);
                return;
            }
        }
    } catch (e) { }

    console.log(`     [FAIL] No cover found`);
}

function downloadFile(url, dest) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) { resolve(false); return; }
            // Check for 1x1 pixel (OpenLibrary often returns 43 bytes 1x1 gif/jpg for missing)
            if (parseInt(res.headers['content-length']) < 100) { resolve(false); return; }

            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
        }).on('error', () => resolve(false));
    });
}

run();
