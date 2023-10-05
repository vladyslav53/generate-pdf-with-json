const PDFDocument = require("pdfkit");
const SVGtoPDF = require("svg-to-pdfkit");
const fs = require("fs");

require("dotenv").config();

const quotes = require("./advice-mini");

let {
    PRIMARY_COLOR,
    SECONDARY_COLOR,
    MARGIN_HORIZONTAL,
    MARGIN_VERTICAL,
    PAGE_WIDTH,
    PAGE_HEIGHT,
} = process.env;

PAGE_HEIGHT = parseInt(PAGE_HEIGHT);
PAGE_WIDTH = parseInt(PAGE_WIDTH);
MARGIN_HORIZONTAL = parseInt(MARGIN_HORIZONTAL);
MARGIN_VERTICAL = parseInt(MARGIN_VERTICAL);
/* ******************************************** Initialize document settings ******************************************** */
/* ******* Create Object ******* */
const doc = new PDFDocument({
    size: [PAGE_WIDTH, PAGE_HEIGHT],
    font: "./static/fonts/Inter-Regular.ttf",
    margins: {
        bottom: MARGIN_VERTICAL,
        top: MARGIN_VERTICAL,
        left: MARGIN_HORIZONTAL,
        right: MARGIN_HORIZONTAL,
    },
    autoFirstPage: false,
    bufferPages: true,
});

/* ******* Initialize variables for page numbering and configure link settings ******* */
let pageNumber = 0,
    shouldHidePageNumbers = [];
doc.on("pageAdded", () => {
    doc.addNamedDestination(pageNumber++);
});

/* ******* Configure the output variables ******* */
doc.pipe(fs.createWriteStream("output.pdf"));

/* ******* Define the functions for building PDF ******* */
function calculateCenterPosition(doc, text) {
    console.log(text);
    console.log(PAGE_WIDTH, doc.widthOfString(text));
    return (PAGE_WIDTH - doc.widthOfString(text)) / 2;
}

function fillBackground(doc, color) {
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(color);
}

/* ******************************************** Book Cover Building ******************************************** */
doc.addPage();
fillBackground(doc, "black");
const svg = fs.readFileSync("./static/logo.svg", "utf-8");

SVGtoPDF(doc, svg, (PAGE_WIDTH - 316) / 2, 296, {
    width: 316,
    height: 66,
    preserveAspectRatio: "none",
});

let coverText =
    "A curated collection of actionable advice from the world’s greatest minds on personal growth, relationships, health, and entrepreneurship.";

doc.fontSize(10)
    .lineGap(4.3)
    .fillColor(PRIMARY_COLOR)
    .text(coverText, (PAGE_WIDTH - 312) / 2, 523, {
        align: "center",
        width: 312,
    });

/* ******************************************** TOC Building ******************************************** */
doc.addPage();
doc.font("./static/fonts/Inter-Bold.ttf", 32)
    .lineGap(12.8)
    .fillColor(PRIMARY_COLOR)
    .text("Contents", 72, 195)
    .moveDown(80 / 32 / 2);

let tocY = doc.y,
    tocX = doc.x,
    tocItems = [];

/* ******* Make placeholder for TOC. This is required for correct page numbering. ******* */
for (let nameKey in quotes) {
    doc.font("./static/fonts/Inter-Regular.ttf", 10)
        .lineGap(4)
        .text(" ")
        .moveDown(8 / 14 / 2);
}

let startContentPage = pageNumber - 1;

/* ******************************************** Quotes pages building ******************************************** */
for (let nameKey in quotes) {
    let { name, company, content } = quotes[nameKey];
    doc.addPage();
    let nameFontSize = 32,
        companyFontSize = 20;
    fillBackground(doc, "black");
    doc.font("./static/fonts/Inter-Bold.ttf", nameFontSize)
        .fillColor("white")
        .lineGap(12.8)
        .text(
            name,
            calculateCenterPosition(doc.fontSize(nameFontSize), name),
            288
        )
        .lineGap(8)
        .font("./static/fonts/Inter-Regular.ttf", 20)
        .fillColor(PRIMARY_COLOR)
        .text(
            company,
            calculateCenterPosition(doc.fontSize(companyFontSize), company)
        );

    /* ******* Store pages which should hide page number ******* */
    shouldHidePageNumbers.push(pageNumber - 1);
    /* ******* Store info for building TOC ******* */
    tocItems.push({
        name: name + "  ",
        pageNumber: pageNumber - 1,
    });

    doc.addPage();

    let adviceArray = JSON.parse(content);
    for (let i = 0; i < adviceArray.length; ++i) {
        let { advice, adviceTitle, reference, question } = adviceArray[i];
        let adviceTitleFontSize = 20,
            normalFontSize = 12;
        doc.font("./static/fonts/Inter-Bold.ttf", adviceTitleFontSize)
            .fillColor(SECONDARY_COLOR)
            .lineGap(8)
            .text(adviceTitle)
            .moveDown(20 / 28 / 2)
            .font("./static/fonts/Inter-Regular.ttf", normalFontSize)
            .fillColor(SECONDARY_COLOR)
            .lineGap(3.6)
            .text(advice)
            .moveDown(8 / 15.6 / 2)
            .font("./static/fonts/Inter-Italic.ttf", normalFontSize)
            .fillColor(SECONDARY_COLOR)
            .text(reference)
            .moveDown(16 / 15.6 / 2)
            .lineWidth(0.5)
            .strokeColor("#E5E7EB")
            .moveTo(MARGIN_HORIZONTAL, doc.y)
            .lineTo(doc.page.width - MARGIN_HORIZONTAL, doc.y)
            .stroke()
            .moveDown(30 / 15.6 / 2)
            .font("./static/fonts/Inter-Medium.ttf", normalFontSize)
            .fillColor(SECONDARY_COLOR)
            .text("Question: " + question)
            .moveDown(110 / 15.6 / 2);
    }
}

/* ******************************************** TOC body building ******************************************** */
let currentTocPage = 1;
doc.switchToPage(currentTocPage++);
(doc.x = tocX), (doc.y = tocY);

for (let i = 0; i < tocItems.length; ++i) {
    let tocItem = tocItems[i];
    doc.font("./static/fonts/Inter-Regular.ttf", 10)
        .lineGap(4)
        .fillColor(SECONDARY_COLOR);
    let dotString = " .";
    let dotWidth = doc.widthOfString(dotString);
    let nameWidth = doc.widthOfString(tocItem.name);
    let pageNumberWidth = 20;
    let totalDotWidth =
        doc.page.width - MARGIN_HORIZONTAL * 2 - nameWidth - pageNumberWidth;

    let dotCount = parseInt(totalDotWidth / dotWidth);
    doc.text(tocItem.name, {
        continued: true,
        align: "left",
        goTo: tocItem.pageNumber,
    }).text("  " + tocItem.pageNumber - startContentPage, {
        width: pageNumberWidth,
        align: "right",
        goTo: tocItem.pageNumber,
    });

    /* Fill dot between title and page number BEGIN*/
    let backupX = doc.x,
        backupY = doc.y;
    doc.text(
        dotString.repeat(dotCount),
        doc.x + nameWidth,
        doc.y -
            doc.currentLineHeight(false) * 0.5 -
            doc.currentLineHeight(true),
        {
            width: totalDotWidth,
            align: "right",
            goTo: tocItem.pageNumber,
        }
    );
    (doc.x = backupX), (doc.y = backupY);
    /* Fill dot between title and page number END*/

    doc.moveDown(8 / 14 / 2);

    if (
        doc.y + doc.currentLineHeight(true) >=
        doc.page.height - doc.page.margins.bottom
    ) {
        doc.switchToPage(currentTocPage++);
        doc.y = doc.page.margins.top;
    }
}
/* Add TOC END */

/* Add Page Number BEGIN */
/**
 * The reason why I didn't add page number in `pageAdded` event is that when the page added, it will automatically changes the font settings(font-family, color, etc) and we can't restore it.
 */
let pages = doc.bufferedPageRange();
for (let i = startContentPage + 1; i < pages.count; i++) {
    if (shouldHidePageNumbers.indexOf(i) >= 0) continue;
    doc.switchToPage(i);

    //Footer: Add page number
    let oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; //Dumb: Have to remove bottom margin in order to write into it

    let displayPageNumber = i - startContentPage;
    doc.fontSize(8)
        .fillColor(PRIMARY_COLOR)
        .text(
            displayPageNumber + "",
            calculateCenterPosition(doc, displayPageNumber + ""),
            604
        );

    doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
}
/* Add Page Number END */

doc.flushPages();

doc.end();
