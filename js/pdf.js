// ==========================================
// PDF GENERATION
// ==========================================

const PDF = {
    
    COMPANY: {
        name: 'DesignFox',
        email: 'info@designfox.com',
        phone: '+94 77 123 4567',
        address: '123 Business Street, Colombo, Sri Lanka',
        website: 'www.designfox.com'
    },

    // Preview PDF before download
    previewPDF(doc, filename) {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        App.showModal('PDF Preview', `
            <div style="text-align:center;margin-bottom:12px;">
                <span class="badge badge-info" style="font-size:12px;padding:6px 14px;">${filename}</span>
            </div>
            <iframe src="${pdfUrl}" style="width:100%;height:500px;border:1px solid #e5e7eb;border-radius:8px;background:#f8fafc;"></iframe>
        `, `<button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
            <button class="btn btn-primary" onclick="PDF._downloadCurrent()"><i class="fas fa-download"></i> Download PDF</button>`);
        
        PDF._currentDoc = doc;
        PDF._currentFilename = filename;
    },

    _downloadCurrent() {
        if (PDF._currentDoc) {
            PDF._currentDoc.save(PDF._currentFilename);
            App.showToast('PDF downloaded!', 'success');
        }
    },

    // Generate Quotation PDF
    generateQuotation(quotationId) {
        try {
            const q = DB.getById('quotations', quotationId);
            if (!q) { App.showToast('Quotation not found', 'error'); return; }
            if (!window.jspdf) { App.showToast('PDF library loading... try again', 'error'); return; }
            
            const customer = DB.getById('customers', q.customerId);
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Recalculate total from items
            let grandTotal = 0;
            (q.items || []).forEach(item => {
                const sub = item.qty * item.price;
                grandTotal += sub - (sub * (item.discount || 0) / 100);
            });
            if (grandTotal > 0) q.total = grandTotal;

        // Header Background
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 38, 'F');

        // Company Name
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(this.COMPANY.name, 15, 18);

        // Company Details
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`${this.COMPANY.email} | ${this.COMPANY.phone}`, 15, 26);
        doc.text(this.COMPANY.address, 15, 32);

        // Document Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('QUOTATION', 195, 20, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(q.number, 195, 28, { align: 'right' });

        // Reset color
        doc.setTextColor(0, 0, 0);
        let y = 50;

        // Quotation Info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Quotation Details:', 15, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`Number: ${q.number}`, 15, y + 8);
        doc.text(`Date: ${q.createdAt}`, 15, y + 15);
        doc.text(`Status: ${q.status}`, 15, y + 22);

        // Customer Info
        doc.setFont('helvetica', 'bold');
        doc.text('Bill To:', 120, y);
        doc.setFont('helvetica', 'normal');
        doc.text(customer?.name || 'N/A', 120, y + 8);
        if (customer?.company) doc.text(customer.company, 120, y + 15);
        if (customer?.email) doc.text(customer.email, 120, y + 22);
        if (customer?.phone) doc.text(customer.phone, 120, y + 29);
        if (customer?.address) doc.text(customer.address, 120, y + 36);

        y += 48;

        // Line separator
        doc.setDrawColor(200, 200, 200);
        doc.line(15, y, 195, y);
        y += 8;

        // Items Table
        const tableData = (q.items || []).map((item, i) => {
            const subtotal = item.qty * item.price;
            const discountAmt = subtotal * (item.discount || 0) / 100;
            const total = subtotal - discountAmt;
            return [
                i + 1,
                item.service,
                item.qty,
                `LKR ${item.price.toLocaleString()}`,
                `${item.discount || 0}%`,
                `LKR ${total.toLocaleString()}`
            ];
        });

        doc.autoTable({
            startY: y,
            head: [['#', 'Service', 'Qty', 'Unit Price', 'Discount', 'Total']],
            body: tableData,
            theme: 'striped',
            headStyles: { 
                fillColor: [37, 99, 235], 
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            styles: { fontSize: 9, cellPadding: 6 },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center' },
                1: { cellWidth: 60 },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 35, halign: 'right' },
                4: { cellWidth: 25, halign: 'center' },
                5: { cellWidth: 35, halign: 'right' }
            }
        });

        // Total
        const finalY = doc.lastAutoTable.finalY + 12;
        doc.setFillColor(240, 249, 255);
        doc.rect(120, finalY - 5, 75, 20, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Grand Total:', 125, finalY + 6);
        doc.setTextColor(37, 99, 235);
        doc.text(`LKR ${q.total.toLocaleString()}`, 190, finalY + 6, { align: 'right' });
        doc.setTextColor(0, 0, 0);

        // Notes
        if (q.notes) {
            const notesY = finalY + 28;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Notes:', 15, notesY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(q.notes, 15, notesY + 8);
        }

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('Thank you for your business!', 105, pageHeight - 18, { align: 'center' });
        doc.text(`Generated by ${this.COMPANY.name} PayTrack System`, 105, pageHeight - 12, { align: 'center' });

        // Save
        this.previewPDF(doc, `Quotation_${q.number}.pdf`);
        } catch (error) {
            console.error('Quotation PDF Error:', error);
            App.showToast('PDF error: ' + error.message, 'error');
        }
    },

    // Generate Invoice PDF - Professional Design
    generateInvoice(invoiceId) {
        try {
            const inv = DB.getById('invoices', invoiceId);
            if (!inv) { App.showToast('Invoice not found', 'error'); return; }
            
            if (!window.jspdf) { App.showToast('PDF library loading... try again', 'error'); return; }
            
            const customer = DB.getById('customers', inv.customerId);
            const quotation = inv.quotationId ? DB.getById('quotations', inv.quotationId) : null;
            
            // Recalculate invoice total from quotation items if available
            if (quotation && quotation.items) {
                let qTotal = 0;
                quotation.items.forEach(item => {
                    const sub = item.qty * item.price;
                    qTotal += sub - (sub * (item.discount || 0) / 100);
                });
                // Invoice is percentage of quotation total
                if (inv.type === 'ADVANCE') {
                    inv.total = qTotal * 0.5;
                } else if (inv.type === 'FINAL') {
                    inv.total = qTotal * 0.5;
                }
                inv.balance = inv.total - (inv.amountPaid || 0);
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
        const pageWidth = 210;
        const pH = doc.internal.pageSize.height;

        // === DARK HEADER ===
        doc.setFillColor(17, 24, 39);
        doc.rect(0, 0, pageWidth, 45, 'F');
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 45, pageWidth, 3, 'F');

        // Company
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(this.COMPANY.name, 15, 20);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 190, 210);
        doc.text(this.COMPANY.address, 15, 28);
        doc.text(`${this.COMPANY.phone}  |  ${this.COMPANY.email}`, 15, 34);

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', 195, 22, { align: 'right' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(147, 197, 253);
        doc.text(`${inv.type} INVOICE`, 195, 32, { align: 'right' });

        // === INFO BOXES ===
        doc.setTextColor(0, 0, 0);
        let y = 58;

        // Left box
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, y, 85, 35, 3, 3, 'F');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('INVOICE NUMBER', 20, y + 7);
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(inv.number, 20, y + 14);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('DATE', 20, y + 22);
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(9);
        doc.text(inv.createdAt, 20, y + 28);

        // Status
        const sc = inv.status === 'PAID' ? [16,185,129] : inv.status === 'PARTIALLY_PAID' ? [245,158,11] : [239,68,68];
        doc.setFillColor(sc[0], sc[1], sc[2]);
        doc.roundedRect(65, y + 2, 30, 7, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text(inv.status.replace('_', ' '), 80, y + 7, { align: 'center' });

        // Right box - Bill To
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(110, y, 85, 35, 3, 3, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('BILL TO', 115, y + 7);
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(customer?.name || 'N/A', 115, y + 14);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        let cY = y + 20;
        if (customer?.company) { doc.text(customer.company, 115, cY); cY += 5; }
        if (customer?.email) { doc.text(customer.email, 115, cY); cY += 5; }
        if (customer?.phone) { doc.text(customer.phone, 115, cY); }

        y += 45;

        // === TABLE ===
        if (quotation && quotation.items) {
            const tableData = quotation.items.map((item, i) => {
                const sub = item.qty * item.price;
                const disc = sub * (item.discount || 0) / 100;
                const total = sub - disc;
                return [i + 1, item.service, item.qty, `LKR ${item.price.toLocaleString()}`, item.discount ? `${item.discount}%` : '-', `LKR ${total.toLocaleString()}`];
            });

            doc.autoTable({
                startY: y,
                head: [['#', 'Service / Description', 'Qty', 'Unit Price', 'Disc', 'Amount']],
                body: tableData,
                theme: 'plain',
                headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', cellPadding: 7 },
                bodyStyles: { fontSize: 9, cellPadding: 6, lineColor: [226, 232, 240], lineWidth: 0.3 },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 62 }, 2: { cellWidth: 18, halign: 'center' }, 3: { cellWidth: 35, halign: 'right' }, 4: { cellWidth: 18, halign: 'center' }, 5: { cellWidth: 38, halign: 'right', fontStyle: 'bold' } }
            });
            y = doc.lastAutoTable.finalY + 10;
        } else {
            y += 5;
        }

        // === TOTALS ===
        const tx = 120;
        doc.setDrawColor(226, 232, 240);
        doc.line(tx, y, 195, y);
        y += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Subtotal:', tx, y);
        doc.setTextColor(17, 24, 39);
        doc.text(`LKR ${inv.total.toLocaleString()}`, 193, y, { align: 'right' });

        y += 7;
        doc.setTextColor(16, 185, 129);
        doc.text('Amount Paid:', tx, y);
        doc.setFont('helvetica', 'bold');
        doc.text(`- LKR ${(inv.amountPaid || 0).toLocaleString()}`, 193, y, { align: 'right' });

        y += 4;
        doc.setDrawColor(17, 24, 39);
        doc.setLineWidth(0.8);
        doc.line(tx, y, 195, y);
        doc.setLineWidth(0.2);
        y += 9;

        // Balance highlight
        if (inv.status === 'PAID') {
            doc.setFillColor(209, 250, 229);
            doc.roundedRect(tx - 3, y - 5, 80, 16, 3, 3, 'F');
            doc.setTextColor(6, 95, 70);
            doc.setFontSize(10);
            doc.text('FULLY PAID', tx + 2, y + 4);
            doc.setFontSize(12);
            doc.text(`LKR ${inv.total.toLocaleString()}`, 192, y + 4, { align: 'right' });
        } else {
            doc.setFillColor(254, 242, 242);
            doc.roundedRect(tx - 3, y - 5, 80, 16, 3, 3, 'F');
            doc.setTextColor(185, 28, 28);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('BALANCE DUE:', tx + 2, y + 4);
            doc.setFontSize(12);
            doc.text(`LKR ${(inv.balance || 0).toLocaleString()}`, 192, y + 4, { align: 'right' });
        }

        doc.setTextColor(0, 0, 0);

        // === BANK DETAILS ===
        if (inv.bankName || inv.accountNumber) {
            const bankY = y + 20;
            doc.setFillColor(240, 249, 255);
            doc.roundedRect(15, bankY - 4, 90, 40, 3, 3, 'F');
            doc.setDrawColor(191, 219, 254);
            doc.roundedRect(15, bankY - 4, 90, 40, 3, 3, 'S');

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text('PAYMENT INFORMATION', 20, bankY + 4);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            doc.setFontSize(8);
            let bY = bankY + 11;
            if (inv.bankName) { doc.text(`Bank:  ${inv.bankName}`, 20, bY); bY += 6; }
            if (inv.accountName) { doc.text(`Account:  ${inv.accountName}`, 20, bY); bY += 6; }
            if (inv.accountNumber) { doc.text(`A/C No:  ${inv.accountNumber}`, 20, bY); bY += 6; }
            if (inv.branch) { doc.text(`Branch:  ${inv.branch}`, 20, bY); }
        }

        // === FOOTER ===
        doc.setFillColor(37, 99, 235);
        doc.rect(0, pH - 22, pageWidth, 2, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text('Thank you for your business!', 105, pH - 14, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`${this.COMPANY.name}  |  ${this.COMPANY.phone}  |  ${this.COMPANY.email}`, 105, pH - 8, { align: 'center' });

        this.previewPDF(doc, `Invoice_${inv.number}.pdf`);
        } catch (error) {
            console.error('Invoice PDF Error:', error);
            App.showToast('PDF error: ' + error.message, 'error');
        }
    },

    // Generate Receipt PDF
    generateReceipt(paymentId) {
        try {
            const payment = DB.getById('payments', paymentId);
            if (!payment) { App.showToast('Payment not found', 'error'); return; }
            if (!window.jspdf) { App.showToast('PDF library loading... try again', 'error'); return; }
            
            const invoice = DB.getById('invoices', payment.invoiceId);
            const customer = invoice ? DB.getById('customers', invoice.customerId) : null;
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

        // Header
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, 210, 38, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(this.COMPANY.name, 15, 18);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`${this.COMPANY.email} | ${this.COMPANY.phone}`, 15, 26);
        doc.text(this.COMPANY.address, 15, 32);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT RECEIPT', 195, 20, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(payment.receiptNo, 195, 28, { align: 'right' });

        doc.setTextColor(0, 0, 0);
        let y = 55;

        // Receipt Info
        doc.setFont('helvetica', 'bold');
        doc.text('Receipt Details:', 15, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`Receipt #: ${payment.receiptNo}`, 15, y + 8);
        doc.text(`Date: ${payment.date}`, 15, y + 15);
        doc.text(`Invoice: ${invoice?.number || 'N/A'}`, 15, y + 22);

        // Received From
        doc.setFont('helvetica', 'bold');
        doc.text('Received From:', 120, y);
        doc.setFont('helvetica', 'normal');
        doc.text(customer?.name || 'N/A', 120, y + 8);
        if (customer?.company) doc.text(customer.company, 120, y + 15);

        y += 40;

        // Payment Details Table
        doc.autoTable({
            startY: y,
            head: [['Description', 'Details']],
            body: [
                ['Amount Received', `LKR ${payment.amount.toLocaleString()}`],
                ['Payment Method', payment.method.replace('_', ' ')],
                ['Reference', payment.reference || '-'],
                ['Date', payment.date],
                ['Invoice Number', invoice?.number || '-']
            ],
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 10 },
            styles: { fontSize: 10, cellPadding: 8 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { cellWidth: 100 }
            }
        });

        // Amount Highlight
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFillColor(209, 250, 229);
        doc.roundedRect(30, finalY, 150, 25, 5, 5, 'F');
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(6, 95, 70);
        doc.text(`Amount Paid: LKR ${payment.amount.toLocaleString()}`, 105, finalY + 15, { align: 'center' });

        doc.setTextColor(0, 0, 0);

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('Thank you for your payment!', 105, pageHeight - 18, { align: 'center' });
        doc.text(`Generated by ${this.COMPANY.name} PayTrack System`, 105, pageHeight - 12, { align: 'center' });

        this.previewPDF(doc, `Receipt_${payment.receiptNo}.pdf`);
        } catch (error) {
            console.error('Receipt PDF Error:', error);
            App.showToast('PDF error: ' + error.message, 'error');
        }
    }
};
