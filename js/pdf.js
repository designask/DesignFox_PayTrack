// ==========================================
// PDF GENERATION - DesignFox Premium Style
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

    // Orange accent color
    ORANGE: [249, 115, 22],
    DARK: [51, 51, 51],
    GRAY: [100, 100, 100],
    LIGHT_GRAY: [248, 248, 248],

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

    // ============================================================
    // INVOICE PDF - Premium DesignFox Style
    // ============================================================
    generateInvoice(invoiceId) {
        try {
            const inv = DB.getById('invoices', invoiceId);
            if (!inv) { App.showToast('Invoice not found', 'error'); return; }
            if (!window.jspdf) { App.showToast('PDF library loading... try again', 'error'); return; }
            
            const customer = DB.getById('customers', inv.customerId);
            const quotation = inv.quotationId ? DB.getById('quotations', inv.quotationId) : null;
            const items = (quotation && quotation.items) ? quotation.items : [];
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pw = 210;
            const pH = doc.internal.pageSize.height;

            // === TOP THIN ORANGE BAR ===
            doc.setFillColor(249, 115, 22);
            doc.rect(0, 0, pw, 4, 'F');

            // === HEADER SECTION ===
            // Company Name (left)
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            doc.text('Design', 15, 18);
            doc.setTextColor(249, 115, 22);
            doc.text('Fox', 50, 18);
            
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(140, 140, 140);
            doc.text('PRIVATE LIMITED', 15, 23);
            doc.text('Reg No: ' + this.COMPANY.regNo, 15, 27);

            // Invoice title (right)
            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            doc.text('INVOICE', 195, 16, { align: 'right' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(249, 115, 22);
            doc.text('No. ' + inv.number, 195, 23, { align: 'right' });

            // === ORANGE META STRIP ===
            const stripY = 32;
            doc.setFillColor(249, 115, 22);
            doc.rect(15, stripY, 180, 12, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.text('ISSUE DATE', 20, stripY + 4);
            doc.text('DUE DATE', 65, stripY + 4);
            doc.text('CURRENCY', 110, stripY + 4);
            doc.text('PROJECT', 150, stripY + 4);
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(inv.createdAt || new Date().toLocaleDateString(), 20, stripY + 9);
            doc.text('30 days', 65, stripY + 9);
            doc.text('LKR', 110, stripY + 9);
            doc.text(quotation ? quotation.number : '-', 150, stripY + 9);

            // === FROM / BILL TO SECTION ===
            const infoY = 50;
            
            // Light gray background for from/to section
            doc.setFillColor(250, 250, 250);
            doc.rect(15, infoY, 180, 32, 'F');
            doc.setDrawColor(235, 235, 235);
            doc.rect(15, infoY, 180, 32, 'S');
            
            // FROM
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(249, 115, 22);
            doc.text('FROM', 20, infoY + 5);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            doc.text('DesignFox Pvt Ltd', 20, infoY + 11);
            
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('No: 365/G, Galkanda Road,', 20, infoY + 16);
            doc.text('Kiriwaththuduwa, Homagama', 20, infoY + 20);
            doc.text('Sri Lanka', 20, infoY + 24);
            doc.text(this.COMPANY.phone, 20, infoY + 28);

            // BILL TO
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(249, 115, 22);
            doc.text('BILL TO', 115, infoY + 5);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            doc.text(customer?.name || 'N/A', 115, infoY + 11);
            
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            let bY = infoY + 16;
            if (customer?.address) { doc.text(customer.address, 115, bY); bY += 4; }
            if (customer?.company) { doc.text(customer.company, 115, bY); bY += 4; }
            if (customer?.email) { doc.text(customer.email, 115, bY); bY += 4; }
            if (customer?.phone) { doc.text(customer.phone, 115, bY); }

            // === ITEMS TABLE ===
            let y = 88;

            if (items.length > 0) {
                // Calculate items with tax
                const tableData = items.map((item, idx) => {
                    const unitRate = item.price || 0;
                    const qty = item.qty || 1;
                    const tax = item.tax || 0;
                    const subtotal = qty * unitRate;
                    const taxAmt = subtotal * tax / 100;
                    const total = subtotal + taxAmt;
                    return [
                        String(idx + 1).padStart(2, '0'),
                        (item.service || item.serviceName || 'Service') + (item.description ? '\n' + item.description : ''),
                        unitRate.toLocaleString() + '.00',
                        qty,
                        tax > 0 ? tax + '%' : '-',
                        total.toLocaleString() + '.00'
                    ];
                });

                doc.autoTable({
                    startY: y,
                    head: [['NO', 'DESCRIPTION', 'UNIT RATE', 'QTY', 'TAX', 'TOTAL']],
                    body: tableData,
                    theme: 'plain',
                    headStyles: {
                        fillColor: [255, 255, 255],
                        textColor: [100, 100, 100],
                        fontSize: 7,
                        fontStyle: 'bold',
                        cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
                        lineColor: [200, 200, 200],
                        lineWidth: { bottom: 0.5 }
                    },
                    bodyStyles: {
                        fontSize: 9,
                        cellPadding: { top: 6, bottom: 6, left: 3, right: 3 },
                        textColor: [51, 51, 51],
                        lineColor: [235, 235, 235],
                        lineWidth: { bottom: 0.3 }
                    },
                    columnStyles: {
                        0: { cellWidth: 12, halign: 'center', textColor: [100,100,100] },
                        1: { cellWidth: 65 },
                        2: { cellWidth: 30, halign: 'right' },
                        3: { cellWidth: 15, halign: 'center' },
                        4: { cellWidth: 18, halign: 'center', textColor: [100,100,100] },
                        5: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
                    }
                });
                y = doc.lastAutoTable.finalY + 8;
            } else {
                doc.setFontSize(9);
                doc.setTextColor(150, 150, 150);
                doc.setFont('helvetica', 'italic');
                doc.text('No itemized services linked to this invoice.', 15, y + 5);
                y += 15;
            }

            // === TOTALS SECTION (right aligned) ===
            const tx = 125;
            const valX = 193;

            // Calculate subtotal, tax, discount
            let subtotal = 0;
            let totalTax = 0;
            let discount = 0;
            items.forEach(item => {
                const sub = (item.qty || 1) * (item.price || 0);
                subtotal += sub;
                totalTax += sub * (item.tax || 0) / 100;
                discount += sub * (item.discount || 0) / 100;
            });
            const grandTotal = subtotal + totalTax - discount;

            doc.setDrawColor(220, 220, 220);
            doc.line(tx, y, valX, y);
            y += 7;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Subtotal', tx, y);
            doc.setTextColor(51, 51, 51);
            doc.text('LKR ' + subtotal.toLocaleString() + '.00', valX, y, { align: 'right' });

            y += 6;
            doc.setTextColor(100, 100, 100);
            doc.text('Tax / VAT', tx, y);
            doc.setTextColor(51, 51, 51);
            doc.text('LKR ' + totalTax.toLocaleString() + '.00', valX, y, { align: 'right' });

            y += 6;
            doc.setTextColor(100, 100, 100);
            doc.text('Discount', tx, y);
            doc.setTextColor(51, 51, 51);
            doc.text('- LKR ' + discount.toLocaleString() + '.00', valX, y, { align: 'right' });

            // Grand Total / Total Due - Orange box
            y += 8;
            doc.setFillColor(249, 115, 22);
            doc.roundedRect(tx - 3, y, 74, 14, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('Total Due', tx + 2, y + 9);
            doc.setFontSize(12);
            const totalDue = inv.total - (inv.amountPaid || 0);
            doc.text('LKR ' + totalDue.toLocaleString() + '.00', valX - 3, y + 9, { align: 'right' });

            // === PAYMENT STATUS BADGE ===
            const badgeY = pH - 28;
            if (inv.status === 'PAID') {
                doc.setFillColor(220, 252, 231);
                doc.roundedRect(148, badgeY, 45, 11, 3, 3, 'F');
                doc.setTextColor(22, 101, 52);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text('Paid', 170, badgeY + 7, { align: 'center' });
            } else if (inv.status === 'PARTIALLY_PAID') {
                doc.setFillColor(254, 243, 199);
                doc.roundedRect(135, badgeY, 58, 11, 3, 3, 'F');
                doc.setTextColor(146, 64, 14);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text('Partially Paid', 164, badgeY + 7, { align: 'center' });
            } else {
                doc.setDrawColor(249, 115, 22);
                doc.setLineWidth(0.6);
                doc.roundedRect(130, badgeY, 63, 11, 3, 3, 'S');
                doc.setTextColor(249, 115, 22);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text('Payment Pending', 161, badgeY + 7, { align: 'center' });
            }

            // === FOOTER NOTE ===
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(140, 140, 140);
            doc.text('Thank you for your business! Payment within due date appreciated.', 15, pH - 20);

            // Bottom dark bar
            doc.setFillColor(51, 51, 51);
            doc.rect(0, pH - 6, pw, 6, 'F');

            this.previewPDF(doc, 'Invoice_' + inv.number + '.pdf');
        } catch (error) {
            console.error('Invoice PDF Error:', error);
            App.showToast('PDF error: ' + error.message, 'error');
        }
    },

    // ============================================================
    // QUOTATION PDF
    // ============================================================
    generateQuotation(quotationId) {
        try {
            const q = DB.getById('quotations', quotationId);
            if (!q) { App.showToast('Quotation not found', 'error'); return; }
            if (!window.jspdf) { App.showToast('PDF library loading... try again', 'error'); return; }
            
            const customer = DB.getById('customers', q.customerId);
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pw = 210;
            const pH = doc.internal.pageSize.height;
            
            let grandTotal = 0;
            (q.items || []).forEach(item => {
                const sub = (item.qty || 1) * (item.price || 0);
                grandTotal += sub - (sub * (item.discount || 0) / 100);
            });
            if (grandTotal > 0) q.total = grandTotal;

            // === TOP ORANGE BAR ===
            doc.setFillColor(249, 115, 22);
            doc.rect(0, 0, pw, 4, 'F');

            // === HEADER ===
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            doc.text('Design', 15, 18);
            doc.setTextColor(249, 115, 22);
            doc.text('Fox', 50, 18);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(140, 140, 140);
            doc.text('PRIVATE LIMITED', 15, 23);
            doc.text('Reg No: ' + this.COMPANY.regNo, 15, 27);

            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            doc.text('QUOTATION', 195, 16, { align: 'right' });
            doc.setFontSize(10);
            doc.setTextColor(249, 115, 22);
            doc.text('No. ' + q.number, 195, 23, { align: 'right' });

            // === ORANGE META STRIP ===
            const stripY = 32;
            doc.setFillColor(249, 115, 22);
            doc.rect(15, stripY, 180, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.text('ISSUE DATE', 20, stripY + 4);
            doc.text('VALID UNTIL', 65, stripY + 4);
            doc.text('CURRENCY', 110, stripY + 4);
            doc.text('STATUS', 150, stripY + 4);
            doc.setFontSize(8);
            doc.text(q.createdAt || '-', 20, stripY + 9);
            doc.text('30 days', 65, stripY + 9);
            doc.text('LKR', 110, stripY + 9);
            doc.text(q.status, 150, stripY + 9);

            // === FROM / BILL TO ===
            const infoY = 50;
            doc.setFillColor(250, 250, 250);
            doc.rect(15, infoY, 180, 32, 'F');
            doc.setDrawColor(235, 235, 235);
            doc.rect(15, infoY, 180, 32, 'S');

            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(249, 115, 22);
            doc.text('FROM', 20, infoY + 5);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            doc.text('DesignFox Pvt Ltd', 20, infoY + 11);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('No: 365/G, Galkanda Road,', 20, infoY + 16);
            doc.text('Kiriwaththuduwa, Homagama', 20, infoY + 20);
            doc.text('Sri Lanka', 20, infoY + 24);
            doc.text(this.COMPANY.phone, 20, infoY + 28);

            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(249, 115, 22);
            doc.text('BILL TO', 115, infoY + 5);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            doc.text(customer?.name || 'N/A', 115, infoY + 11);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            let cY = infoY + 16;
            if (customer?.company) { doc.text(customer.company, 115, cY); cY += 4; }
            if (customer?.address) { doc.text(customer.address, 115, cY); cY += 4; }
            if (customer?.email) { doc.text(customer.email, 115, cY); cY += 4; }
            if (customer?.phone) { doc.text(customer.phone, 115, cY); }

            // === ITEMS TABLE ===
            let y = 88;
            const tableData = (q.items || []).map((item, i) => {
                const sub = (item.qty || 1) * (item.price || 0);
                const disc = sub * (item.discount || 0) / 100;
                const total = sub - disc;
                return [
                    String(i + 1).padStart(2, '0'),
                    (item.service || 'Service') + (item.description ? '\n' + item.description : ''),
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
                headStyles: { fillColor: [255,255,255], textColor: [100,100,100], fontSize: 7, fontStyle: 'bold', cellPadding: {top:4,bottom:4,left:3,right:3}, lineColor: [200,200,200], lineWidth: {bottom: 0.5} },
                bodyStyles: { fontSize: 9, cellPadding: {top:6,bottom:6,left:3,right:3}, textColor: [51,51,51], lineColor: [235,235,235], lineWidth: {bottom: 0.3} },
                columnStyles: { 0:{cellWidth:12,halign:'center',textColor:[100,100,100]}, 1:{cellWidth:80}, 2:{cellWidth:32,halign:'right'}, 3:{cellWidth:18,halign:'center'}, 4:{cellWidth:35,halign:'right',fontStyle:'bold'} }
            });

            const finalY = doc.lastAutoTable.finalY + 10;

            // === BANK DETAILS (left) ===
            doc.setFillColor(248, 248, 248);
            doc.roundedRect(15, finalY, 90, 35, 2, 2, 'F');
            doc.setDrawColor(220, 220, 220);
            doc.roundedRect(15, finalY, 90, 35, 2, 2, 'S');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(249, 115, 22);
            doc.text('BANK TRANSFER DETAILS', 20, finalY + 7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(70, 70, 70);
            doc.setFontSize(8);
            doc.text('Bank of Ceylon', 20, finalY + 13);
            doc.text('A/C No: 0012-3456-7890', 20, finalY + 18);
            doc.text('Branch: Homagama', 20, finalY + 23);
            doc.text('Swift: BCEYLKLX', 20, finalY + 28);

            // === TOTALS (right) ===
            const tx = 125;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Subtotal', tx, finalY + 7);
            doc.setTextColor(51, 51, 51);
            doc.text('LKR ' + q.total.toLocaleString() + '.00', 193, finalY + 7, { align: 'right' });

            // Grand Total orange box
            doc.setFillColor(249, 115, 22);
            doc.roundedRect(tx - 3, finalY + 12, 74, 14, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('Grand Total', tx + 2, finalY + 21);
            doc.setFontSize(12);
            doc.text('LKR ' + q.total.toLocaleString() + '.00', 190, finalY + 21, { align: 'right' });

            if (q.notes) {
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                doc.text('Notes: ' + q.notes, 15, finalY + 42);
            }

            // Footer
            doc.setFillColor(51, 51, 51);
            doc.rect(0, pH - 6, pw, 6, 'F');

            this.previewPDF(doc, 'Quotation_' + q.number + '.pdf');
        } catch (error) {
            console.error('Quotation PDF Error:', error);
            App.showToast('PDF error: ' + error.message, 'error');
        }
    },

    // ============================================================
    // RECEIPT PDF
    // ============================================================
    generateReceipt(paymentId) {
        try {
            const payment = DB.getById('payments', paymentId);
            if (!payment) { App.showToast('Payment not found', 'error'); return; }
            if (!window.jspdf) { App.showToast('PDF library loading... try again', 'error'); return; }
            
            const invoice = DB.getById('invoices', payment.invoiceId);
            const customer = invoice ? DB.getById('customers', invoice.customerId) : null;
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pw = 210;
            const pH = doc.internal.pageSize.height;

            // === TOP ORANGE BAR ===
            doc.setFillColor(249, 115, 22);
            doc.rect(0, 0, pw, 4, 'F');

            // === HEADER ===
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            doc.text('Design', 15, 18);
            doc.setTextColor(249, 115, 22);
            doc.text('Fox', 50, 18);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(140, 140, 140);
            doc.text('PRIVATE LIMITED', 15, 23);

            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            doc.text('RECEIPT', 195, 16, { align: 'right' });
            doc.setFontSize(10);
            doc.setTextColor(249, 115, 22);
            doc.text('No. ' + payment.receiptNo, 195, 23, { align: 'right' });

            // === META STRIP ===
            const stripY = 32;
            doc.setFillColor(249, 115, 22);
            doc.rect(15, stripY, 180, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.text('DATE', 20, stripY + 4);
            doc.text('INVOICE', 65, stripY + 4);
            doc.text('CURRENCY', 110, stripY + 4);
            doc.text('METHOD', 150, stripY + 4);
            doc.setFontSize(8);
            doc.text(payment.date || '-', 20, stripY + 9);
            doc.text(invoice?.number || '-', 65, stripY + 9);
            doc.text('LKR', 110, stripY + 9);
            doc.text(payment.method.replace('_', ' '), 150, stripY + 9);

            // === FROM / RECEIVED FROM ===
            const infoY = 50;
            doc.setFillColor(250, 250, 250);
            doc.rect(15, infoY, 180, 28, 'F');
            doc.setDrawColor(235, 235, 235);
            doc.rect(15, infoY, 180, 28, 'S');

            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(249, 115, 22);
            doc.text('FROM', 20, infoY + 5);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            doc.text('DesignFox Pvt Ltd', 20, infoY + 11);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Kiriwaththuduwa, Homagama, Sri Lanka', 20, infoY + 16);
            doc.text(this.COMPANY.phone, 20, infoY + 21);

            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(249, 115, 22);
            doc.text('RECEIVED FROM', 115, infoY + 5);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            doc.text(customer?.name || 'N/A', 115, infoY + 11);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            if (customer?.company) doc.text(customer.company, 115, infoY + 16);
            if (customer?.email) doc.text(customer.email, 115, infoY + 21);

            // === PAYMENT DETAILS TABLE ===
            let y = 84;
            doc.autoTable({
                startY: y,
                head: [['Description', 'Details']],
                body: [
                    ['Amount Received', 'LKR ' + payment.amount.toLocaleString() + '.00'],
                    ['Payment Method', payment.method.replace('_', ' ')],
                    ['Reference', payment.reference || '-'],
                    ['Date Received', payment.date],
                    ['Invoice Number', invoice?.number || '-']
                ],
                theme: 'plain',
                headStyles: { fillColor: [249,115,22], textColor: [255,255,255], fontSize: 9, cellPadding: 6 },
                bodyStyles: { fontSize: 9, cellPadding: 7, lineColor: [235,235,235], lineWidth: {bottom: 0.3} },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, textColor: [80,80,80] }, 1: { cellWidth: 100 } }
            });

            // Amount highlight
            const fY = doc.lastAutoTable.finalY + 12;
            doc.setFillColor(249, 115, 22);
            doc.roundedRect(30, fY, 150, 18, 3, 3, 'F');
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('Amount Paid: LKR ' + payment.amount.toLocaleString() + '.00', 105, fY + 12, { align: 'center' });

            // Footer note
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(140, 140, 140);
            doc.text('Thank you for your payment!', 15, pH - 14);

            doc.setFillColor(51, 51, 51);
            doc.rect(0, pH - 6, pw, 6, 'F');

            this.previewPDF(doc, 'Receipt_' + payment.receiptNo + '.pdf');
        } catch (error) {
            console.error('Receipt PDF Error:', error);
            App.showToast('PDF error: ' + error.message, 'error');
        }
    }
};
