// ==========================================
// PDF GENERATION - DesignFox Style
// ==========================================

const PDF = {
    
    COMPANY: {
        name: 'DesignFox',
        subtitle: 'PRIVATE LIMITED',
        regNo: 'PV-00310586',
        email: 'info@designfox.com',
        phone: '047 22 48 412 / 071 72 49 544',
        address: 'No: 365/G, Galkanda Road,\nKiriwaththuduwa, Homagama\nSri Lanka',
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

    // ============ QUOTATION PDF ============
    generateQuotation(quotationId) {
        try {
            const q = DB.getById('quotations', quotationId);
            if (!q) { App.showToast('Quotation not found', 'error'); return; }
            if (!window.jspdf) { App.showToast('PDF library loading... try again', 'error'); return; }
            
            const customer = DB.getById('customers', q.customerId);
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            let grandTotal = 0;
            (q.items || []).forEach(item => {
                const sub = item.qty * item.price;
                grandTotal += sub - (sub * (item.discount || 0) / 100);
            });
            if (grandTotal > 0) q.total = grandTotal;

            this._drawHeader(doc, 'QUOTATION', q.number);
            this._drawInfoBar(doc, q.createdAt, '', 'LKR', 'Quotation');
            this._drawFromTo(doc, customer);

            let y = 90;
            const tableData = (q.items || []).map((item, i) => {
                const sub = item.qty * item.price;
                const total = sub - (sub * (item.discount || 0) / 100);
                return [String(i+1).padStart(2,'0'), item.service + (item.description ? '\n'+item.description : ''), item.price.toLocaleString()+'.00', item.qty, total.toLocaleString()+'.00'];
            });

            doc.autoTable({
                startY: y,
                head: [['NO', 'DESCRIPTION', 'UNIT RATE', 'QTY', 'TOTAL']],
                body: tableData,
                theme: 'plain',
                headStyles: { fillColor: [255,255,255], textColor: [100,100,100], fontSize: 8, fontStyle: 'bold', cellPadding: 5, lineColor: [200,200,200], lineWidth: {bottom: 0.5} },
                bodyStyles: { fontSize: 9, cellPadding: 8, textColor: [51,51,51], lineColor: [240,240,240], lineWidth: {bottom: 0.3} },
                columnStyles: { 0:{cellWidth:15,halign:'center'}, 1:{cellWidth:75}, 2:{cellWidth:35,halign:'right'}, 3:{cellWidth:20,halign:'center'}, 4:{cellWidth:38,halign:'right',fontStyle:'bold'} }
            });

            const finalY = doc.lastAutoTable.finalY + 12;

            // Bank Details (left) - on Quotation
            doc.setFillColor(248, 248, 248);
            doc.roundedRect(15, finalY - 2, 90, 38, 2, 2, 'F');
            doc.setDrawColor(220, 220, 220);
            doc.roundedRect(15, finalY - 2, 90, 38, 2, 2, 'S');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(243, 115, 33);
            doc.text('BANK TRANSFER DETAILS', 20, finalY + 6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(70, 70, 70);
            doc.setFontSize(8);
            doc.text('Bank of Ceylon', 20, finalY + 13);
            doc.text('A/C No: 0012-3456-7890', 20, finalY + 19);
            doc.text('Branch: Homagama', 20, finalY + 25);
            doc.text('Swift: BCEYLKLX', 20, finalY + 31);

            // Grand Total (right - orange box)
            doc.setFillColor(243, 115, 33);
            doc.roundedRect(120, finalY, 75, 14, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Grand Total', 125, finalY + 9);
            doc.setFontSize(11);
            doc.text('LKR ' + q.total.toLocaleString() + '.00', 190, finalY + 9, { align: 'right' });

            if (q.notes) {
                doc.setTextColor(100,100,100);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                doc.text('Notes: ' + q.notes, 15, finalY + 45);
            }

            this._drawFooter(doc);
            this.previewPDF(doc, 'Quotation_' + q.number + '.pdf');
        } catch (error) {
            console.error('Quotation PDF Error:', error);
            App.showToast('PDF error: ' + error.message, 'error');
        }
    },

    // ============ INVOICE PDF (DesignFox Style) ============
    generateInvoice(invoiceId) {
        try {
            const inv = DB.getById('invoices', invoiceId);
            if (!inv) { App.showToast('Invoice not found', 'error'); return; }
            if (!window.jspdf) { App.showToast('PDF library loading... try again', 'error'); return; }
            
            const customer = DB.getById('customers', inv.customerId);
            const quotation = inv.quotationId ? DB.getById('quotations', inv.quotationId) : null;
            
            // Get items - check both 'items' key variations
            const items = (quotation && quotation.items) ? quotation.items : [];
            
            let quotationTotal = 0;
            items.forEach(item => {
                const sub = (item.qty || 1) * (item.price || 0);
                quotationTotal += sub - (sub * (item.discount || 0) / 100);
            });
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pw = 210;
            const pH = doc.internal.pageSize.height;

            // === HEADER ===
            this._drawHeader(doc, 'INVOICE', inv.number);
            this._drawInfoBar(doc, inv.createdAt, '30 days', 'LKR', quotation ? quotation.number : '-');
            this._drawFromTo(doc, customer);

            let y = 90;

            // === ITEMS TABLE ===
            if (items.length > 0) {
                const tableData = items.map((item, idx) => {
                    const sub = (item.qty || 1) * (item.price || 0);
                    const disc = sub * (item.discount || 0) / 100;
                    const total = sub - disc;
                    return [
                        String(idx + 1).padStart(2, '0'),
                        (item.service || item.serviceName || 'Service') + (item.description ? '\n' + item.description : ''),
                        (item.price || 0).toLocaleString() + '.00',
                        item.qty || 1,
                        total.toLocaleString() + '.00'
                    ];
                });

                doc.autoTable({
                    startY: y,
                    head: [['NO', 'DESCRIPTION', 'UNIT RATE', 'QTY', 'TOTAL']],
                    body: tableData,
                    theme: 'plain',
                    headStyles: { fillColor: [255,255,255], textColor: [100,100,100], fontSize: 8, fontStyle: 'bold', cellPadding: 5, lineColor: [200,200,200], lineWidth: {bottom: 0.5} },
                    bodyStyles: { fontSize: 9, cellPadding: 8, textColor: [51,51,51], lineColor: [240,240,240], lineWidth: {bottom: 0.3} },
                    columnStyles: { 0:{cellWidth:15,halign:'center'}, 1:{cellWidth:75}, 2:{cellWidth:35,halign:'right'}, 3:{cellWidth:20,halign:'center'}, 4:{cellWidth:38,halign:'right',fontStyle:'bold'} }
                });
                y = doc.lastAutoTable.finalY + 10;
            } else {
                doc.setFontSize(10);
                doc.setTextColor(100,100,100);
                doc.text('(No itemized services linked to this invoice)', 15, y + 5);
                y += 15;
            }

            // === TOTALS (right side only - NO bank details on invoice) ===
            const tx = 120;
            doc.setDrawColor(226, 232, 240);
            doc.line(tx, y, 195, y);
            y += 8;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Subtotal', tx, y);
            doc.setTextColor(51, 51, 51);
            doc.text('LKR ' + (quotationTotal || inv.total).toLocaleString() + '.00', 193, y, { align: 'right' });

            y += 8;
            const pct = inv.advancePercent || 50;
            const advAmt = inv.advanceAmount || (inv.total * pct / 100);
            doc.setTextColor(100, 100, 100);
            doc.text('Advance Payment (' + pct + '%)', tx, y);
            doc.setTextColor(51, 51, 51);
            doc.text('- LKR ' + advAmt.toLocaleString() + '.00', 193, y, { align: 'right' });

            // Total Due orange box
            y += 10;
            doc.setFillColor(243, 115, 33);
            doc.roundedRect(tx, y, 75, 14, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Total Due', tx + 5, y + 9);
            doc.setFontSize(11);
            const totalDue = inv.total - (inv.amountPaid || 0);
            doc.text('LKR ' + totalDue.toLocaleString() + '.00', 190, y + 9, { align: 'right' });

            // === FOOTER ===
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('Payment within the due date is appreciated.', 15, pH - 22);

            // Status badge
            if (inv.status === 'PAID') {
                doc.setFillColor(209, 250, 229);
                doc.roundedRect(145, pH - 27, 48, 12, 3, 3, 'F');
                doc.setTextColor(6, 95, 70);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text('PAID', 169, pH - 19, { align: 'center' });
            } else {
                doc.setDrawColor(243, 115, 33);
                doc.setLineWidth(0.6);
                doc.roundedRect(130, pH - 27, 63, 12, 3, 3, 'S');
                doc.setTextColor(243, 115, 33);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text('Payment Pending', 161, pH - 19, { align: 'center' });
            }

            this._drawFooter(doc);
            this.previewPDF(doc, 'Invoice_' + inv.number + '.pdf');
        } catch (error) {
            console.error('Invoice PDF Error:', error);
            App.showToast('PDF error: ' + error.message, 'error');
        }
    },

    // ============ RECEIPT PDF ============
    generateReceipt(paymentId) {
        try {
            const payment = DB.getById('payments', paymentId);
            if (!payment) { App.showToast('Payment not found', 'error'); return; }
            if (!window.jspdf) { App.showToast('PDF library loading... try again', 'error'); return; }
            
            const invoice = DB.getById('invoices', payment.invoiceId);
            const customer = invoice ? DB.getById('customers', invoice.customerId) : null;
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pH = doc.internal.pageSize.height;

            this._drawHeader(doc, 'RECEIPT', payment.receiptNo);
            this._drawInfoBar(doc, payment.date, '', 'LKR', invoice ? invoice.number : '-');
            this._drawFromTo(doc, customer);

            let y = 90;

            doc.autoTable({
                startY: y,
                head: [['Description', 'Details']],
                body: [
                    ['Amount Received', 'LKR ' + payment.amount.toLocaleString() + '.00'],
                    ['Payment Method', payment.method.replace('_', ' ')],
                    ['Reference', payment.reference || '-'],
                    ['Date', payment.date],
                    ['Invoice', invoice?.number || '-']
                ],
                theme: 'plain',
                headStyles: { fillColor: [243,115,33], textColor: [255,255,255], fontSize: 9, cellPadding: 7 },
                bodyStyles: { fontSize: 10, cellPadding: 8, lineColor: [240,240,240], lineWidth: {bottom: 0.3} },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 100 } }
            });

            const finalY = doc.lastAutoTable.finalY + 15;
            doc.setFillColor(243, 115, 33);
            doc.roundedRect(30, finalY, 150, 20, 3, 3, 'F');
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('Amount Paid: LKR ' + payment.amount.toLocaleString() + '.00', 105, finalY + 13, { align: 'center' });

            this._drawFooter(doc);
            this.previewPDF(doc, 'Receipt_' + payment.receiptNo + '.pdf');
        } catch (error) {
            console.error('Receipt PDF Error:', error);
            App.showToast('PDF error: ' + error.message, 'error');
        }
    },

    // ============ SHARED HELPERS ============
    _drawHeader(doc, title, number) {
        const pw = 210;
        // Top dark bar
        doc.setFillColor(51, 51, 51);
        doc.rect(0, 0, pw, 10, 'F');

        // Company name
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 51, 51);
        doc.text('Design', 15, 22);
        doc.setTextColor(243, 115, 33);
        doc.text('Fox', 49, 22);
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(140, 140, 140);
        doc.text(this.COMPANY.subtitle, 15, 27);
        doc.text('Reg No: ' + this.COMPANY.regNo, 15, 31);

        // Title right
        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 51, 51);
        doc.text(title, 195, 22, { align: 'right' });
        doc.setFontSize(10);
        doc.setTextColor(243, 115, 33);
        doc.text('No. ' + number, 195, 30, { align: 'right' });
    },

    _drawInfoBar(doc, issueDate, dueDate, currency, project) {
        doc.setFillColor(243, 115, 33);
        doc.rect(15, 36, 180, 9, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('ISSUE DATE', 20, 41);
        doc.text('DUE DATE', 60, 41);
        doc.text('CURRENCY', 100, 41);
        doc.text('PROJECT', 140, 41);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(issueDate || '-', 20, 44);
        doc.text(dueDate || '30 days', 60, 44);
        doc.text(currency || 'LKR', 100, 44);
        doc.text(project || '-', 140, 44);
    },

    _drawFromTo(doc, customer) {
        let y = 52;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(140, 140, 140);
        doc.text('FROM', 15, y);
        doc.text('BILL TO', 110, y);

        doc.setFontSize(11);
        doc.setTextColor(51, 51, 51);
        doc.text(this.COMPANY.name + ' Pvt Ltd', 15, y + 7);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('No: 365/G, Galkanda Road,', 15, y + 13);
        doc.text('Kiriwaththuduwa, Homagama', 15, y + 18);
        doc.text('Sri Lanka', 15, y + 23);
        doc.text(this.COMPANY.phone, 15, y + 28);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 51, 51);
        doc.text(customer?.name || 'N/A', 110, y + 7);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        if (customer?.address) doc.text(customer.address, 110, y + 13);
        if (customer?.email) doc.text(customer.email, 110, y + 18);
        if (customer?.phone) doc.text(customer.phone, 110, y + 23);
    },

    _drawFooter(doc) {
        const pw = 210;
        const pH = doc.internal.pageSize.height;
        doc.setFillColor(51, 51, 51);
        doc.rect(0, pH - 8, pw, 8, 'F');
    }
};
