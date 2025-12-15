/**
 * Script to download book covers for offline use.
 * 
 * Instructions:
 * 1. Ensure you have Node.js installed.
 * 2. Run: npm install node-fetch fs
 * 3. Run: node download_covers.js
 * 
 * This script will:
 * - Read your Goodreads CSV URL
 * - Parse ISBNs
 * - Download covers from OpenLibrary/GoogleBooks
 * - Save them to an 'images/covers/' directory
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Your csv config
const GOODREADS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRO-DmKFr8w-VvQPBiQIuqGmHfDzDfCT6bjA63_0r2vkz8SOTv0t-cdw9PEDWzEpy08Vx9yUD_M6AiM/pub?gid=0&single=true&output=csv';
const OUTPUT_DIR = './images/covers';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log("Fetching CSV...");

async function run() {
    try {
        const res = await fetch(GOODREADS_CSV_URL);
        const text = await res.text();
        const lines = text.split('\n').slice(1); // Skip header

        for (const line of lines) {
            const cols = parseCSVLine(line);
            // Index 6 = ISBN13, Index 5 = ISBN10
            const isbn = (cols[6] || cols[5] || '').replace(/["=]/g, '').replace(/[^0-9X]/g, '');
            const title = cols[1];

            if (isbn && isbn.length >= 10) {
                console.log(`Checking ${title} (${isbn})...`);
                await downloadCover(isbn);
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
        console.log(`  -> Exists: ${filePath}`);
        return;
    }

    // Try OpenLibrary
    const olUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    if (await downloadFile(olUrl, filePath)) {
        console.log(`  -> Downloaded from OpenLibrary`);
        return;
    }

    // Try Google Books
    try {
        const gRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
        const gData = await gRes.json();
        const link = gData.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
        if (link) {
            if (await downloadFile(link.replace('http:', 'https:'), filePath)) {
                console.log(`  -> Downloaded from GoogleBooks`);
                return;
            }
        }
    } catch (e) { }

    console.log(`  -> No cover found`);
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
