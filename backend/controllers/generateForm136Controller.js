import PDFDocument from "pdfkit";

const generateForm136Controller = async (req, res) => {
    try {
        const {
            fullName,
            caseNumber,
            employment,
            monthlyIncome,
            monthlyExpenses,
            assets,
            liabilities
        } = req.body;

        if (
            !fullName?.trim() ||
            !caseNumber?.trim() ||
            monthlyIncome === undefined ||
            monthlyExpenses === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Full name, case number, monthly income and monthly expenses are required."
            });
        }

        const income = Number(monthlyIncome);
        const expenses = Number(monthlyExpenses);

        if (
            !Number.isFinite(income) ||
            !Number.isFinite(expenses) ||
            income < 0 ||
            expenses < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Income and expenses must be valid non-negative amounts."
            });
        }

        const pdf = new PDFDocument({
            size: "A4",
            margins: {
                top: 50,
                bottom: 50,
                left: 50,
                right: 50
            }
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="form-136-draft.pdf"'
        );
        res.setHeader("Cache-Control", "no-store");

        pdf.pipe(res);

        const money = (amount) =>
            `INR ${amount.toLocaleString("en-IN", {
                maximumFractionDigits: 2
            })}`;

        pdf.fontSize(18)
            .font("Helvetica-Bold")
            .text("FINANCIAL DISCLOSURE", { align: "center" });

        pdf.moveDown(0.5);
        pdf.fontSize(10)
            .font("Helvetica")
            .text("FORM 136 - DRAFT", { align: "center" });

        pdf.moveDown(2);

        const details = [
            ["Full name", fullName.trim()],
            ["Case number", caseNumber.trim()],
            ["Employment / occupation", employment?.trim() || "Not provided"],
            ["Monthly income", money(income)],
            ["Monthly expenses", money(expenses)],
            ["Assets and property", assets?.trim() || "Not provided"],
            ["Loans and liabilities", liabilities?.trim() || "Not provided"]
        ];

        for (const [label, value] of details) {
            pdf.font("Helvetica-Bold")
                .fontSize(11)
                .text(`${label}:`, { continued: true });

            pdf.font("Helvetica")
                .text(` ${value}`);

            pdf.moveDown(0.8);
        }

        pdf.moveDown(2);

        pdf.fontSize(9)
            .font("Helvetica-Bold")
            .text("IMPORTANT NOTICE");

        pdf.moveDown(0.5);

        pdf.font("Helvetica")
            .text(
                "This document is a draft generated for demonstration purposes. " +
                "It is not an official court form and has not been filed with a court. " +
                "Verify the applicable official form and all details before use.",
                { align: "justify" }
            );

        pdf.end();
    } catch (error) {
        console.error("Form 136 PDF generation failed:", error);

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to generate Form 136 PDF."
            });
        }

        res.destroy(error);
    }
};

export default generateForm136Controller;