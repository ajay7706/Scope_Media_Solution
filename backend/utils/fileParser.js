const xlsx = require('xlsx');
const fs = require('fs');
const pdf = require('pdf-parse');

const parseFile = async (filePath) => {
    const extension = filePath.split('.').pop().toLowerCase();
    
    if (extension === 'pdf') {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            
            // Basic PDF parsing logic: Split by lines and try to extract structured data
            const lines = data.text.split('\n').filter(line => line.trim().length > 0);
            const results = [];
            
            // This is a very basic heuristic parser for PDFs
            // We look for patterns like: Name (Text), Mobile (10 digits), Pincode (6 digits)
            for (const line of lines) {
                const mobileMatch = line.match(/\b\d{10}\b/);
                const pinMatch = line.match(/\b\d{6}\b/);
                
                if (mobileMatch) {
                    // Try to guess name: text before mobile or the whole line
                    const name = line.replace(mobileMatch[0], '').replace(pinMatch ? pinMatch[0] : '', '').trim();
                    results.push({
                        name: name || 'Unknown',
                        mobile: mobileMatch[0],
                        pincode: pinMatch ? pinMatch[0] : '000000'
                    });
                }
            }
            return results;
        } catch (error) {
            console.error('PDF parsing error:', error);
            throw new Error('Failed to parse PDF file');
        }
    } else {
        // Excel/CSV parsing
        try {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);
            return data;
        } catch (error) {
            console.error('Excel parsing error:', error);
            throw new Error('Failed to parse Excel/CSV file');
        }
    }
};

module.exports = { parseFile };
