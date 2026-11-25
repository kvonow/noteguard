import Foundation
import CoreGraphics

let root = "/Users/kwonhaewon/Desktop/학교/3-2/noteguard"
let originalURL = URL(fileURLWithPath: root + "/tmp/pdfs/practice-before-update.pdf")
let normalizedURL = URL(fileURLWithPath: root + "/output/pdf/math-all-questions-normalized.pdf")
let outputURL = URL(fileURLWithPath: root + "/noteguard-web/dist/assets/practice.pdf")
guard let original = CGPDFDocument(originalURL as CFURL), let normalized = CGPDFDocument(normalizedURL as CFURL) else {
    fatalError("Could not open the source PDFs")
}
guard original.numberOfPages >= 2, normalized.numberOfPages >= 30 else {
    fatalError("The source PDFs do not contain the expected pages")
}
var mediaBox = CGRect(x: 0, y: 0, width: 595.276, height: 841.89)
guard let context = CGContext(outputURL as CFURL, mediaBox: &mediaBox, nil) else {
    fatalError("Could not create the combined exam PDF")
}
let pages: [(CGPDFDocument, Int)] = [(original, 1), (original, 2)] + (3...30).map { (normalized, $0) }
for (document, pageNumber) in pages {
    guard let page = document.page(at: pageNumber) else { fatalError("Missing page \(pageNumber)") }
    context.beginPDFPage(nil)
    context.drawPDFPage(page)
    context.endPDFPage()
}
context.closePDF()
print("Assembled 30 pages: original pages 1-2 plus normalized pages 3-30")
