import Foundation
import CoreGraphics
import PDFKit

struct PageBound: Decodable {
    let page: Int
    let pixelWidth: CGFloat
    let pixelHeight: CGFloat
    let x0: CGFloat
    let y0: CGFloat
    let x1: CGFloat
    let y1: CGFloat
}

let inputURL = URL(fileURLWithPath: "/Users/kwonhaewon/Downloads/math-all-questions-uniform.pdf")
let outputURL = URL(fileURLWithPath: "/Users/kwonhaewon/Desktop/학교/3-2/noteguard/output/pdf/math-all-questions-normalized.pdf")
let boundsURL = URL(fileURLWithPath: "/Users/kwonhaewon/Desktop/학교/3-2/noteguard/tmp/pdfs/uniform-check/bounds.json")
let bounds = try JSONDecoder().decode([PageBound].self, from: Data(contentsOf: boundsURL))
guard let document = CGPDFDocument(inputURL as CFURL), document.numberOfPages == bounds.count else {
    fatalError("Could not open the source PDF or page counts do not match")
}
var pageRect = CGRect(x: 0, y: 0, width: 595.276, height: 841.89)
guard let context = CGContext(outputURL as CFURL, mediaBox: &pageRect, nil) else {
    fatalError("Could not create the output PDF")
}
let target = CGRect(x: 28, y: 142, width: pageRect.width - 56, height: 650)
let targetTop = target.maxY

for bound in bounds {
    guard let page = document.page(at: bound.page) else { fatalError("Missing source page \(bound.page)") }
    let sourceBox = page.getBoxRect(.mediaBox)
    let sx = bound.pixelWidth / sourceBox.width
    let sy = bound.pixelHeight / sourceBox.height
    let crop = CGRect(
        x: bound.x0 / sx,
        y: sourceBox.height - bound.y1 / sy,
        width: (bound.x1 - bound.x0) / sx,
        height: (bound.y1 - bound.y0) / sy
    )
    let scale = min(target.width / crop.width, target.height / crop.height)
    let tx = target.midX - crop.midX * scale
    let ty = targetTop - crop.maxY * scale
    context.beginPDFPage(nil)
    context.saveGState()
    context.clip(to: target)
    context.concatenate(CGAffineTransform(a: scale, b: 0, c: 0, d: scale, tx: tx, ty: ty))
    context.drawPDFPage(page)
    context.restoreGState()
    context.endPDFPage()
}
context.closePDF()
print("Created \(bounds.count) uniformly framed pages at \(outputURL.path)")
