// ==========================================
// PAGE RENDERERS
// ==========================================

const Pages = {

    // ============ DASHBOARD ============
    dashboard() {
        const stats = DB.getStats();
        const recentQ = DB.getAll('quotations').slice(-3).reverse();
        const recentP = DB.getAll('payments').slice(-5).reverse();

        document.getElementById('content').innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fas fa-file-alt"></i></div>
                    <div class="stat-info"><p>Total Quotations</p><h4>${stats.totalQuotations}</h4></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-info"><p>Approved</p><h4>${stats.approvedQuotations}</h4></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon yellow"><i class="fas fa-clock"></i></div>
                    <div class="stat-info"><p>Pending Payments</p><h4>${stats.pendingPayments}</h4></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-dollar-sign"></i></div>
                    <div class="stat-info"><p>Total Income</p><h4>${App.money(stats.totalIncome)}</h4></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="stat-info"><p>Balance Due</p><h4>${App.money(stats.totalBalance)}</h4></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple"><i class="fas fa-users"></i></div>
                    <div class="stat-info"><p>Customers</p><h4>${stats.totalCustomers}</h4></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon indigo"><i class="fas fa-folder"></i></div>
                    <div class="stat-info"><p>Projects</p><h4>${stats.totalProjects}</h4></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-trophy"></i></div>
                    <div class="stat-info"><p>Completed</p><h4>${stats.completedProjects}</h4></div>
                </div>
            </div>

            <div class="grid-2">
                <div class="card">
                    <div class="card-header"><h3>Recent Quotations</h3></div>
                    <div class="table-container">
                        <table>
                            <thead><tr><th>Number</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
                            <tbody>
                                ${recentQ.map(q => `
                                    <tr>
                                        <td><strong>${q.number}</strong></td>
                                        <td>${DB.getCustomerName(q.customerId)}</td>
                                        <td>${App.money(q.total)}</td>
                                        <td><span class="badge badge-${q.status === 'APPROVED' ? 'success' : q.status === 'SENT' ? 'info' : q.status === 'REJECTED' ? 'danger' : 'gray'}">${q.status}</span></td>
                                    </tr>
                                `).join('')}
                                ${recentQ.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#999;">No quotations yet</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>Recent Payments</h3></div>
                    <div class="table-container">
                        <table>
                            <thead><tr><th>Receipt</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
                            <tbody>
                                ${recentP.map(p => `
                                    <tr>
                                        <td><strong>${p.receiptNo}</strong></td>
                                        <td style="color:var(--success);font-weight:600;">${App.money(p.amount)}</td>
                                        <td>${p.method.replace('_', ' ')}</td>
                                        <td>${p.date}</td>
                                    </tr>
                                `).join('')}
                                ${recentP.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#999;">No payments yet</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    // ============ CUSTOMERS ============
    customers() {
        const customers = DB.getAll('customers');
        
        document.getElementById('content').innerHTML = `
            <div class="card-header" style="margin-bottom:16px;">
                <div class="search-box">
                    <input type="text" id="customer-search" placeholder="Search customers..." oninput="Pages.filterCustomers()">
                </div>
                <button class="btn btn-primary" onclick="Pages.addCustomer()"><i class="fas fa-plus"></i> Add Customer</button>
            </div>
            <div class="card" style="padding:0;">
                <div class="table-container">
                    <table>
                        <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
                        <tbody id="customers-table">
                            ${this.renderCustomerRows(customers)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderCustomerRows(customers) {
        if (customers.length === 0) return '<tr><td colspan="5" class="empty-state">No customers found</td></tr>';
        return customers.map(c => `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.company || '-'}</td>
                <td>${c.email || '-'}</td>
                <td>${c.phone || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="Pages.editCustomer('${c.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="Pages.deleteCustomer('${c.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    },

    filterCustomers() {
        const search = document.getElementById('customer-search').value.toLowerCase();
        const customers = DB.getAll('customers').filter(c => 
            c.name.toLowerCase().includes(search) || 
            (c.company || '').toLowerCase().includes(search) ||
            (c.email || '').toLowerCase().includes(search) ||
            (c.phone || '').includes(search)
        );
        document.getElementById('customers-table').innerHTML = this.renderCustomerRows(customers);
    },

    addCustomer() {
        App.showModal('Add Customer', `
            <form id="customer-form">
                <div class="grid-2">
                    <div class="form-group"><label>Name *</label><input id="c-name" required></div>
                    <div class="form-group"><label>Company</label><input id="c-company"></div>
                </div>
                <div class="grid-2">
                    <div class="form-group"><label>Email</label><input type="email" id="c-email"></div>
                    <div class="form-group"><label>Phone</label><input id="c-phone"></div>
                </div>
                <div class="form-group"><label>Address</label><textarea id="c-address" rows="2"></textarea></div>
            </form>
        `, `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="Pages.saveCustomer()">Save Customer</button>`);
    },

    saveCustomer(id) {
        const data = {
            name: document.getElementById('c-name').value,
            company: document.getElementById('c-company').value,
            email: document.getElementById('c-email').value,
            phone: document.getElementById('c-phone').value,
            address: document.getElementById('c-address').value
        };
        if (!data.name) { App.showToast('Name is required', 'error'); return; }
        
        if (id) {
            DB.update('customers', id, data);
            App.showToast('Customer updated!', 'success');
        } else {
            DB.add('customers', data);
            App.showToast('Customer added!', 'success');
        }
        App.closeModal();
        Pages.customers();
    },

    editCustomer(id) {
        const c = DB.getById('customers', id);
        App.showModal('Edit Customer', `
            <form id="customer-form">
                <div class="grid-2">
                    <div class="form-group"><label>Name *</label><input id="c-name" value="${c.name}" required></div>
                    <div class="form-group"><label>Company</label><input id="c-company" value="${c.company || ''}"></div>
                </div>
                <div class="grid-2">
                    <div class="form-group"><label>Email</label><input type="email" id="c-email" value="${c.email || ''}"></div>
                    <div class="form-group"><label>Phone</label><input id="c-phone" value="${c.phone || ''}"></div>
                </div>
                <div class="form-group"><label>Address</label><textarea id="c-address" rows="2">${c.address || ''}</textarea></div>
            </form>
        `, `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="Pages.saveCustomer('${id}')">Update</button>`);
    },

    deleteCustomer(id) {
        if (confirm('Delete this customer?')) {
            DB.delete('customers', id);
            App.showToast('Customer deleted', 'success');
            Pages.customers();
        }
    },

    // ============ QUOTATIONS ============
    quotations() {
        const quotations = DB.getAll('quotations');

        document.getElementById('content').innerHTML = `
            <div class="card-header" style="margin-bottom:16px;">
                <select id="qt-filter" onchange="Pages.filterQuotations()" class="btn btn-secondary">
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
                <button class="btn btn-primary" onclick="Pages.newQuotation()"><i class="fas fa-plus"></i> New Quotation</button>
            </div>
            <div class="card" style="padding:0;">
                <div class="table-container">
                    <table>
                        <thead><tr><th>Number</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                        <tbody id="quotations-table">
                            ${this.renderQuotationRows(quotations)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderQuotationRows(quotations) {
        if (quotations.length === 0) return '<tr><td colspan="7" class="empty-state">No quotations</td></tr>';
        const invoices = DB.getAll('invoices');
        
        return quotations.map(q => {
            // Check if invoice already exists for this quotation
            const linkedInvoice = invoices.find(i => i.quotationId === q.id);
            
            let actionButtons = '';
            if (q.status === 'DRAFT') {
                actionButtons = `<button class="btn btn-sm btn-info" onclick="Pages.updateQuotationStatus('${q.id}','SENT')">Send</button>`;
            } else if (q.status === 'SENT') {
                actionButtons = `<button class="btn btn-sm btn-success" onclick="Pages.updateQuotationStatus('${q.id}','APPROVED')">Approve</button>`;
            } else if (q.status === 'APPROVED') {
                actionButtons = `<span class="badge badge-success" style="padding:6px 12px;font-size:11px;"><i class="fas fa-check-circle"></i> Approved</span>`;
                if (!linkedInvoice) {
                    actionButtons += ` <button class="btn btn-sm btn-primary" onclick="Pages.createInvoiceFromQuotation('${q.id}')" title="Create Invoice"><i class="fas fa-file-invoice"></i> Invoice</button>`;
                }
            } else if (q.status === 'REJECTED') {
                actionButtons = `<span class="badge badge-danger" style="padding:6px 12px;font-size:11px;"><i class="fas fa-times-circle"></i> Rejected</span>`;
            }
            
            // Invoice info row
            let invoiceRow = '';
            if (linkedInvoice) {
                invoiceRow = `
                <tr style="background:#f0fdf4;">
                    <td colspan="7" style="padding:8px 16px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                            <div style="display:flex;align-items:center;gap:12px;">
                                <i class="fas fa-file-invoice-dollar" style="color:var(--success);font-size:16px;"></i>
                                <div>
                                    <strong style="color:var(--primary);">${linkedInvoice.number}</strong>
                                    <span class="badge badge-${linkedInvoice.type === 'ADVANCE' ? 'info' : 'gray'}" style="margin-left:8px;">${linkedInvoice.type}</span>
                                    <span class="badge badge-${linkedInvoice.status === 'PAID' ? 'success' : linkedInvoice.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}" style="margin-left:4px;">${linkedInvoice.status.replace('_',' ')}</span>
                                </div>
                            </div>
                            <div style="display:flex;align-items:center;gap:12px;font-size:13px;">
                                <span>Total: <strong>${App.money(linkedInvoice.total)}</strong></span>
                                <span style="color:var(--success);">Paid: <strong>${App.money(linkedInvoice.amountPaid || 0)}</strong></span>
                                <span style="color:var(--danger);">Due: <strong>${App.money(linkedInvoice.balance || 0)}</strong></span>
                                <button class="btn btn-sm btn-secondary" onclick="PDF.generateInvoice('${linkedInvoice.id}')" title="Invoice PDF"><i class="fas fa-file-pdf"></i></button>
                                ${linkedInvoice.status !== 'PAID' ? `<button class="btn btn-sm btn-success" onclick="Pages.recordPayment('${linkedInvoice.id}')"><i class="fas fa-credit-card"></i> Pay</button>` : ''}
                            </div>
                        </div>
                    </td>
                </tr>`;
            }
            
            return `
            <tr>
                <td><strong style="color:var(--primary);cursor:pointer;" onclick="Pages.viewQuotation('${q.id}')">${q.number}</strong></td>
                <td>${DB.getCustomerName(q.customerId)}</td>
                <td>${q.items?.length || 0} items</td>
                <td><strong>${App.money(q.total)}</strong></td>
                <td><span class="badge badge-${q.status === 'APPROVED' ? 'success' : q.status === 'SENT' ? 'info' : q.status === 'REJECTED' ? 'danger' : 'gray'}">${q.status}</span></td>
                <td>${q.createdAt}</td>
                <td>
                    ${actionButtons}
                    <button class="btn btn-sm btn-secondary" onclick="PDF.generateQuotation('${q.id}')" title="Download PDF"><i class="fas fa-file-pdf"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="Pages.deleteQuotation('${q.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
            ${invoiceRow}
        `}).join('');
    },

    filterQuotations() {
        const status = document.getElementById('qt-filter').value;
        let quotations = DB.getAll('quotations');
        if (status) quotations = quotations.filter(q => q.status === status);
        document.getElementById('quotations-table').innerHTML = this.renderQuotationRows(quotations);
    },

    newQuotation() {
        const customers = DB.getAll('customers');
        App.showModal('New Quotation', `
            <form id="quotation-form">
                <div class="form-group">
                    <label>Customer *</label>
                    <select id="q-customer" required>
                        <option value="">Select customer</option>
                        ${customers.map(c => `<option value="${c.id}">${c.name} ${c.company ? '(' + c.company + ')' : ''}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Service Items</label>
                    <div id="q-items">
                        <div class="item-row">
                            <input placeholder="Service name" class="q-service">
                            <input type="number" placeholder="Qty" value="1" class="q-qty" min="1">
                            <input type="number" placeholder="Price" class="q-price" min="0">
                            <input type="number" placeholder="Disc %" class="q-disc" value="0" min="0" max="100">
                            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove();Pages.calcQuotationTotal()">×</button>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="Pages.addQuotationItem()" style="margin-top:8px;"><i class="fas fa-plus"></i> Add Item</button>
                </div>
                <div style="text-align:right;font-size:18px;font-weight:700;margin-top:16px;">
                    Total: <span id="q-total">LKR 0</span>
                </div>
                <div class="form-group" style="margin-top:16px;">
                    <label>Notes</label>
                    <textarea id="q-notes" rows="2"></textarea>
                </div>
            </form>
        `, `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="Pages.saveQuotation()">Create Quotation</button>`);

        // Add event listeners for calculation
        document.querySelectorAll('.q-qty, .q-price, .q-disc').forEach(el => {
            el.addEventListener('input', () => Pages.calcQuotationTotal());
        });
    },

    addQuotationItem() {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <input placeholder="Service name" class="q-service">
            <input type="number" placeholder="Qty" value="1" class="q-qty" min="1">
            <input type="number" placeholder="Price" class="q-price" min="0">
            <input type="number" placeholder="Disc %" class="q-disc" value="0" min="0" max="100">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove();Pages.calcQuotationTotal()">×</button>
        `;
        document.getElementById('q-items').appendChild(row);
        row.querySelectorAll('.q-qty, .q-price, .q-disc').forEach(el => {
            el.addEventListener('input', () => Pages.calcQuotationTotal());
        });
    },

    calcQuotationTotal() {
        let total = 0;
        document.querySelectorAll('.item-row').forEach(row => {
            const qty = parseFloat(row.querySelector('.q-qty')?.value || 0);
            const price = parseFloat(row.querySelector('.q-price')?.value || 0);
            const disc = parseFloat(row.querySelector('.q-disc')?.value || 0);
            const sub = qty * price;
            total += sub - (sub * disc / 100);
        });
        const el = document.getElementById('q-total');
        if (el) el.textContent = App.money(total);
    },

    saveQuotation() {
        const customerId = document.getElementById('q-customer').value;
        if (!customerId) { App.showToast('Select a customer', 'error'); return; }

        const items = [];
        let total = 0;
        document.querySelectorAll('.item-row').forEach(row => {
            const service = row.querySelector('.q-service').value;
            const qty = parseFloat(row.querySelector('.q-qty').value || 1);
            const price = parseFloat(row.querySelector('.q-price').value || 0);
            const disc = parseFloat(row.querySelector('.q-disc').value || 0);
            if (service && price > 0) {
                const sub = qty * price;
                const itemTotal = sub - (sub * disc / 100);
                items.push({ service, description: '', qty, price, discount: disc, tax: 0 });
                total += itemTotal;
            }
        });

        if (items.length === 0) { App.showToast('Add at least one item', 'error'); return; }

        DB.add('quotations', {
            number: DB.generateNumber('QT'),
            customerId,
            status: 'DRAFT',
            items,
            total,
            notes: document.getElementById('q-notes').value
        });

        App.closeModal();
        App.showToast('Quotation created!', 'success');
        Pages.quotations();
    },

    updateQuotationStatus(id, status) {
        DB.update('quotations', id, { status });
        
        // If approved, create project
        if (status === 'APPROVED') {
            const q = DB.getById('quotations', id);
            DB.add('projects', {
                quotationId: id,
                customerId: q.customerId,
                title: `Project - ${q.number}`,
                steps: [
                    { name: 'Quotation Approved', status: 'COMPLETED' },
                    { name: 'Advance Invoice Sent', status: 'PENDING' },
                    { name: 'Advance Payment Received', status: 'PENDING' },
                    { name: 'Work Started', status: 'PENDING' },
                    { name: 'Project Completed', status: 'PENDING' },
                    { name: 'Final Invoice Sent', status: 'PENDING' },
                    { name: 'Balance Payment Received', status: 'PENDING' },
                    { name: 'Final Delivery Completed', status: 'PENDING' }
                ]
            });
            App.showToast('Quotation approved & project created!', 'success');
        } else {
            App.showToast(`Quotation ${status.toLowerCase()}`, 'success');
        }
        Pages.quotations();
    },

    deleteQuotation(id) {
        if (confirm('Delete this quotation?')) {
            DB.delete('quotations', id);
            App.showToast('Deleted', 'success');
            Pages.quotations();
        }
    },

    viewQuotation(id) {
        const q = DB.getById('quotations', id);
        const customer = DB.getById('customers', q.customerId);
        
        // Always recalculate total from items
        let recalcTotal = 0;
        (q.items || []).forEach(i => {
            const sub = i.qty * i.price;
            recalcTotal += sub - (sub * (i.discount || 0) / 100);
        });
        if (recalcTotal > 0) {
            q.total = recalcTotal;
            DB.update('quotations', id, { total: recalcTotal });
        }
        
        App.showModal(`Quotation ${q.number}`, `
            <div class="grid-2" style="margin-bottom:16px;">
                <div>
                    <p><strong>Customer:</strong> ${customer?.name || 'N/A'}</p>
                    <p><strong>Company:</strong> ${customer?.company || '-'}</p>
                    <p><strong>Status:</strong> <span class="badge badge-${q.status === 'APPROVED' ? 'success' : q.status === 'SENT' ? 'info' : 'gray'}">${q.status}</span></p>
                </div>
                <div>
                    <p><strong>Date:</strong> ${q.createdAt}</p>
                    <p><strong>Total:</strong> <strong>${App.money(q.total)}</strong></p>
                </div>
            </div>
            <table>
                <thead><tr><th>Service</th><th>Qty</th><th>Price</th><th>Disc%</th><th>Total</th></tr></thead>
                <tbody>
                    ${(q.items || []).map(i => {
                        const sub = i.qty * i.price;
                        const t = sub - (sub * (i.discount || 0) / 100);
                        return `<tr><td>${i.service}</td><td>${i.qty}</td><td>${App.money(i.price)}</td><td>${i.discount || 0}%</td><td><strong>${App.money(t)}</strong></td></tr>`;
                    }).join('')}
                </tbody>
            </table>
            ${q.notes ? `<p style="margin-top:12px;color:var(--gray);font-size:13px;"><strong>Notes:</strong> ${q.notes}</p>` : ''}
            <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
                <button class="btn btn-primary" onclick="PDF.generateQuotation('${id}')"><i class="fas fa-file-pdf"></i> Download PDF</button>
            </div>
        `);
    },

    createInvoiceFromQuotation(qId) {
        const q = DB.getById('quotations', qId);
        
        // Recalculate quotation total from items
        let qTotal = 0;
        (q.items || []).forEach(item => {
            const sub = item.qty * item.price;
            qTotal += sub - (sub * (item.discount || 0) / 100);
        });
        if (qTotal > 0) q.total = qTotal;
        
        const advanceAmount = q.total * 0.5;
        
        const invoice = DB.add('invoices', {
            number: DB.generateNumber('INV-ADV'),
            quotationId: qId,
            customerId: q.customerId,
            type: 'ADVANCE',
            status: 'UNPAID',
            total: advanceAmount,
            amountPaid: 0,
            balance: advanceAmount,
            bankName: 'Commercial Bank',
            accountName: 'DesignFox Pvt Ltd',
            accountNumber: '8012345678',
            branch: 'Colombo'
        });

        // Update project step
        const projects = DB.getAll('projects');
        const project = projects.find(p => p.quotationId === qId);
        if (project) {
            project.steps[1].status = 'COMPLETED';
            DB.update('projects', project.id, { steps: project.steps });
        }

        App.showToast('Advance invoice created (50%)!', 'success');
        Pages.invoices();
    },

    // ============ INVOICES ============
    invoices() {
        const invoices = DB.getAll('invoices');

        document.getElementById('content').innerHTML = `
            <div class="card-header" style="margin-bottom:16px;">
                <select id="inv-filter" onchange="Pages.filterInvoices()" class="btn btn-secondary">
                    <option value="">All Statuses</option>
                    <option value="UNPAID">Unpaid</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="PAID">Paid</option>
                </select>
            </div>
            <div class="card" style="padding:0;">
                <div class="table-container">
                    <table>
                        <thead><tr><th>Invoice #</th><th>Customer</th><th>Type</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody id="invoices-table">
                            ${this.renderInvoiceRows(invoices)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderInvoiceRows(invoices) {
        if (invoices.length === 0) return '<tr><td colspan="8" class="empty-state">No invoices</td></tr>';
        return invoices.map(i => `
            <tr>
                <td><strong style="color:var(--primary)">${i.number}</strong></td>
                <td>${DB.getCustomerName(i.customerId)}</td>
                <td><span class="badge badge-${i.type === 'ADVANCE' ? 'info' : 'gray'}">${i.type}</span></td>
                <td>${App.money(i.total)}</td>
                <td style="color:var(--success)">${App.money(i.amountPaid)}</td>
                <td style="color:var(--danger);font-weight:600;">${App.money(i.balance)}</td>
                <td><span class="badge badge-${i.status === 'PAID' ? 'success' : i.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}">${i.status.replace('_',' ')}</span></td>
                <td>
                    ${i.status !== 'PAID' ? `<button class="btn btn-sm btn-success" onclick="Pages.recordPayment('${i.id}')"><i class="fas fa-credit-card"></i> Pay</button>` : ''}
                    <button class="btn btn-sm btn-secondary" onclick="PDF.generateInvoice('${i.id}')" title="Download PDF"><i class="fas fa-file-pdf"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="Pages.confirmDeleteInvoice('${i.id}')" title="Delete Invoice"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    },

    filterInvoices() {
        const status = document.getElementById('inv-filter').value;
        let invoices = DB.getAll('invoices');
        if (status) invoices = invoices.filter(i => i.status === status);
        document.getElementById('invoices-table').innerHTML = this.renderInvoiceRows(invoices);
    },

    confirmDeleteInvoice(id) {
        const inv = DB.getById('invoices', id);
        App.showModal('Delete Invoice', `
            <div style="text-align:center;padding:20px;">
                <i class="fas fa-exclamation-triangle" style="font-size:48px;color:var(--danger);margin-bottom:16px;"></i>
                <h3 style="margin-bottom:8px;">Are you sure?</h3>
                <p style="color:var(--gray);margin-bottom:16px;">This action cannot be undone. Invoice <strong>${inv?.number || ''}</strong> will be permanently deleted.</p>
                <p style="font-size:13px;color:var(--danger);margin-bottom:8px;">
                    <strong>Invoice:</strong> ${inv?.number}<br>
                    <strong>Customer:</strong> ${DB.getCustomerName(inv?.customerId)}<br>
                    <strong>Amount:</strong> ${App.money(inv?.total)}
                </p>
            </div>
        `, `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-danger" onclick="Pages.deleteInvoice('${id}')"><i class="fas fa-trash"></i> Yes, Delete</button>`);
    },

    deleteInvoice(id) {
        DB.delete('invoices', id);
        App.closeModal();
        App.showToast('Invoice deleted!', 'success');
        Pages.invoices();
    },

    recordPayment(invoiceId) {
        const invoice = DB.getById('invoices', invoiceId);
        App.showModal('Record Payment', `
            <form>
                <p style="margin-bottom:16px;padding:12px;background:var(--gray-light);border-radius:8px;">
                    <strong>Invoice:</strong> ${invoice.number}<br>
                    <strong>Balance Due:</strong> <span style="color:var(--danger);font-weight:700;">${App.money(invoice.balance)}</span>
                </p>
                <div class="grid-2">
                    <div class="form-group"><label>Amount *</label><input type="number" id="pay-amount" value="${invoice.balance}" max="${invoice.balance}" required></div>
                    <div class="form-group"><label>Method</label>
                        <select id="pay-method">
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="CASH">Cash</option>
                            <option value="CARD">Card</option>
                            <option value="ONLINE">Online Payment</option>
                        </select>
                    </div>
                </div>
                <div class="form-group"><label>Reference</label><input id="pay-ref" placeholder="Transaction reference"></div>
            </form>
        `, `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-success" onclick="Pages.savePayment('${invoiceId}')"><i class="fas fa-check"></i> Confirm Payment</button>`);
    },

    savePayment(invoiceId) {
        const amount = parseFloat(document.getElementById('pay-amount').value);
        const method = document.getElementById('pay-method').value;
        const reference = document.getElementById('pay-ref').value;
        const invoice = DB.getById('invoices', invoiceId);

        if (!amount || amount <= 0) { App.showToast('Enter valid amount', 'error'); return; }
        if (amount > invoice.balance) { App.showToast('Amount exceeds balance', 'error'); return; }

        // Add payment
        const receiptNo = DB.generateNumber('RCT');
        DB.add('payments', {
            invoiceId,
            amount,
            method,
            reference,
            date: new Date().toISOString().split('T')[0],
            receiptNo
        });

        // Update invoice
        const newPaid = (invoice.amountPaid || 0) + amount;
        const newBalance = invoice.total - newPaid;
        const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';
        DB.update('invoices', invoiceId, { amountPaid: newPaid, balance: newBalance, status: newStatus });

        // Update project steps
        if (invoice.quotationId) {
            const projects = DB.getAll('projects');
            const project = projects.find(p => p.quotationId === invoice.quotationId);
            if (project) {
                if (invoice.type === 'ADVANCE' && newStatus === 'PAID') {
                    project.steps[2].status = 'COMPLETED';
                    project.steps[3].status = 'IN_PROGRESS';
                }
                if (invoice.type === 'FINAL' && newStatus === 'PAID') {
                    project.steps[6].status = 'COMPLETED';
                    project.steps[7].status = 'IN_PROGRESS';
                }
                DB.update('projects', project.id, { steps: project.steps });
            }
        }

        App.closeModal();
        App.showToast(`Payment recorded! Receipt: ${receiptNo}`, 'success');
        
        // Auto-preview receipt PDF
        const savedPayment = DB.getAll('payments').find(p => p.receiptNo === receiptNo);
        if (savedPayment) {
            setTimeout(() => {
                PDF.generateReceipt(savedPayment.id);
            }, 500);
        }
        
        Pages.invoices();
    },

    // ============ PAYMENTS ============
    payments() {
        const payments = DB.getAll('payments');
        const totalReceived = payments.reduce((s, p) => s + p.amount, 0);

        document.getElementById('content').innerHTML = `
            <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fas fa-receipt"></i></div>
                    <div class="stat-info"><p>Total Payments</p><h4>${payments.length}</h4></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-dollar-sign"></i></div>
                    <div class="stat-info"><p>Total Received</p><h4>${App.money(totalReceived)}</h4></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple"><i class="fas fa-file-alt"></i></div>
                    <div class="stat-info"><p>Receipts</p><h4>${payments.length}</h4></div>
                </div>
            </div>
            <div class="card" style="padding:0;">
                <div class="table-container">
                    <table>
                        <thead><tr><th>Receipt #</th><th>Invoice</th><th>Amount</th><th>Method</th><th>Reference</th><th>Date</th><th>PDF</th></tr></thead>
                        <tbody>
                            ${payments.length === 0 ? '<tr><td colspan="6" class="empty-state">No payments recorded</td></tr>' : ''}
                            ${payments.reverse().map(p => {
                                const inv = DB.getById('invoices', p.invoiceId);
                                return `<tr>
                                    <td><strong>${p.receiptNo}</strong></td>
                                    <td>${inv?.number || '-'}</td>
                                    <td style="color:var(--success);font-weight:700;">${App.money(p.amount)}</td>
                                    <td><span class="badge badge-info">${p.method.replace('_', ' ')}</span></td>
                                    <td>${p.reference || '-'}</td>
                                    <td>${p.date}</td>
                                    <td><button class="btn btn-sm btn-secondary" onclick="PDF.generateReceipt('${p.id}')" title="Download Receipt"><i class="fas fa-file-pdf"></i></button></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // ============ PROJECTS ============
    projects() {
        const projects = DB.getAll('projects');

        document.getElementById('content').innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:16px;">
                ${projects.length === 0 ? '<div class="card empty-state"><i class="fas fa-folder-open" style="font-size:40px;color:#ddd;"></i><p>No projects yet. Approve a quotation to create one.</p></div>' : ''}
                ${projects.map(p => {
                    const completed = p.steps.filter(s => s.status === 'COMPLETED').length;
                    const progress = Math.round((completed / p.steps.length) * 100);
                    return `
                        <div class="card" style="cursor:pointer;" onclick="Pages.viewProject('${p.id}')">
                            <h3 style="margin-bottom:4px;">${p.title}</h3>
                            <p style="font-size:13px;color:var(--gray);margin-bottom:12px;">${DB.getCustomerName(p.customerId)}</p>
                            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                                <span style="font-size:12px;color:var(--gray);">Progress</span>
                                <span style="font-size:12px;font-weight:600;">${progress}%</span>
                            </div>
                            <div class="progress-bar"><div class="progress-fill ${progress === 100 ? 'complete' : ''}" style="width:${progress}%"></div></div>
                            <div style="margin-top:10px;display:flex;gap:4px;">
                                ${p.steps.map(s => `<div style="width:10px;height:10px;border-radius:50%;background:${s.status === 'COMPLETED' ? 'var(--success)' : s.status === 'IN_PROGRESS' ? 'var(--warning)' : '#e5e7eb'};"></div>`).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    viewProject(id) {
        const project = DB.getById('projects', id);
        const customer = DB.getById('customers', project.customerId);
        const quotation = DB.getById('quotations', project.quotationId);

        App.showModal(`${project.title}`, `
            <div style="margin-bottom:16px;">
                <p><strong>Customer:</strong> ${customer?.name} ${customer?.company ? '(' + customer.company + ')' : ''}</p>
                <p><strong>Quotation:</strong> ${quotation?.number} - ${App.money(quotation?.total)}</p>
            </div>
            <h4 style="margin-bottom:12px;">Workflow Progress</h4>
            <div class="timeline">
                ${project.steps.map((s, i) => `
                    <div class="timeline-item">
                        <div class="timeline-dot ${s.status === 'COMPLETED' ? 'completed' : s.status === 'IN_PROGRESS' ? 'in-progress' : ''}"></div>
                        <div class="timeline-content">
                            <div>
                                <h4>${s.name}</h4>
                                <p>Step ${i + 1} of ${project.steps.length}</p>
                            </div>
                            <div>
                                <select onchange="Pages.updateProjectStep('${project.id}', ${i}, this.value)" style="padding:4px 8px;border:1px solid #ddd;border-radius:4px;font-size:11px;">
                                    <option value="PENDING" ${s.status === 'PENDING' ? 'selected' : ''}>Pending</option>
                                    <option value="IN_PROGRESS" ${s.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                                    <option value="COMPLETED" ${s.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `);
    },

    updateProjectStep(projectId, stepIndex, status) {
        const project = DB.getById('projects', projectId);
        project.steps[stepIndex].status = status;
        DB.update('projects', projectId, { steps: project.steps });
        App.showToast('Step updated!', 'success');
    },

    // ============ REPORTS ============
    reports() {
        const stats = DB.getStats();
        const payments = DB.getAll('payments');
        const invoices = DB.getAll('invoices');
        const quotations = DB.getAll('quotations');
        const customers = DB.getAll('customers');

        const pendingInvoices = invoices.filter(i => i.status !== 'PAID');
        const totalPending = pendingInvoices.reduce((s, i) => s + (i.balance || 0), 0);
        const conversionRate = quotations.length > 0 ? Math.round((quotations.filter(q => q.status === 'APPROVED').length / quotations.length) * 100) : 0;

        document.getElementById('content').innerHTML = `
            <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr);">
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-dollar-sign"></i></div>
                    <div class="stat-info"><p>Total Revenue</p><h4>${App.money(stats.totalIncome)}</h4></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red"><i class="fas fa-exclamation"></i></div>
                    <div class="stat-info"><p>Pending Amount</p><h4>${App.money(totalPending)}</h4></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fas fa-percent"></i></div>
                    <div class="stat-info"><p>Conversion Rate</p><h4>${conversionRate}%</h4></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple"><i class="fas fa-users"></i></div>
                    <div class="stat-info"><p>Total Customers</p><h4>${customers.length}</h4></div>
                </div>
            </div>

            <div class="grid-2">
                <div class="card">
                    <div class="card-header"><h3>Pending Payments</h3></div>
                    <table>
                        <thead><tr><th>Invoice</th><th>Customer</th><th>Balance</th></tr></thead>
                        <tbody>
                            ${pendingInvoices.map(i => `
                                <tr>
                                    <td>${i.number}</td>
                                    <td>${DB.getCustomerName(i.customerId)}</td>
                                    <td style="color:var(--danger);font-weight:600;">${App.money(i.balance)}</td>
                                </tr>
                            `).join('')}
                            ${pendingInvoices.length === 0 ? '<tr><td colspan="3" style="text-align:center;color:#999;">No pending payments</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
                <div class="card">
                    <div class="card-header"><h3>Customer Summary</h3></div>
                    <table>
                        <thead><tr><th>Customer</th><th>Quotations</th><th>Paid</th></tr></thead>
                        <tbody>
                            ${customers.map(c => {
                                const cQuotes = quotations.filter(q => q.customerId === c.id).length;
                                const cPaid = payments.filter(p => {
                                    const inv = DB.getById('invoices', p.invoiceId);
                                    return inv && inv.customerId === c.id;
                                }).reduce((s, p) => s + p.amount, 0);
                                return `<tr><td>${c.name}</td><td>${cQuotes}</td><td style="color:var(--success)">${App.money(cPaid)}</td></tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>Quotation Conversion</h3></div>
                <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr);">
                    <div style="text-align:center;padding:20px;background:var(--gray-light);border-radius:8px;">
                        <h3>${quotations.length}</h3><p style="color:var(--gray);font-size:13px;">Total</p>
                    </div>
                    <div style="text-align:center;padding:20px;background:#d1fae5;border-radius:8px;">
                        <h3 style="color:#065f46;">${quotations.filter(q => q.status === 'APPROVED').length}</h3><p style="color:var(--gray);font-size:13px;">Approved</p>
                    </div>
                    <div style="text-align:center;padding:20px;background:#fee2e2;border-radius:8px;">
                        <h3 style="color:#991b1b;">${quotations.filter(q => q.status === 'REJECTED').length}</h3><p style="color:var(--gray);font-size:13px;">Rejected</p>
                    </div>
                    <div style="text-align:center;padding:20px;background:#dbeafe;border-radius:8px;">
                        <h3 style="color:#1e40af;">${conversionRate}%</h3><p style="color:var(--gray);font-size:13px;">Rate</p>
                    </div>
                </div>
            </div>
        `;
    }
};



// ============ BACKUP & RESTORE PAGE ============
Pages.backup = function() {
    const customers = DB.getAll('customers');
    const quotations = DB.getAll('quotations');
    const invoices = DB.getAll('invoices');
    const payments = DB.getAll('payments');
    const projects = DB.getAll('projects');

    document.getElementById('content').innerHTML = `
        <div class="stats-grid" style="grid-template-columns: repeat(5, 1fr);">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-users"></i></div>
                <div class="stat-info"><p>Customers</p><h4>${customers.length}</h4></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-file-alt"></i></div>
                <div class="stat-info"><p>Quotations</p><h4>${quotations.length}</h4></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon yellow"><i class="fas fa-file-invoice"></i></div>
                <div class="stat-info"><p>Invoices</p><h4>${invoices.length}</h4></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><i class="fas fa-credit-card"></i></div>
                <div class="stat-info"><p>Payments</p><h4>${payments.length}</h4></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon indigo"><i class="fas fa-folder"></i></div>
                <div class="stat-info"><p>Projects</p><h4>${projects.length}</h4></div>
            </div>
        </div>

        <div class="grid-2">
            <div class="card" style="text-align:center;padding:40px;">
                <i class="fas fa-download" style="font-size:48px;color:var(--primary);margin-bottom:16px;"></i>
                <h3 style="margin-bottom:8px;">Export / Backup</h3>
                <p style="color:var(--gray);font-size:14px;margin-bottom:20px;">
                    ඔයාගේ data ඔක්කොම JSON file එකක් විදිහට download කරන්න.<br>
                    අලුත් device එකට move කරන්න මේ file එක save කරන්න.
                </p>
                <button class="btn btn-primary btn-full" onclick="App.exportData()" style="max-width:300px;margin:0 auto;">
                    <i class="fas fa-download"></i> Download Backup
                </button>
            </div>

            <div class="card" style="text-align:center;padding:40px;">
                <i class="fas fa-upload" style="font-size:48px;color:var(--success);margin-bottom:16px;"></i>
                <h3 style="margin-bottom:8px;">Import / Restore</h3>
                <p style="color:var(--gray);font-size:14px;margin-bottom:20px;">
                    කලින් download කරපු backup file එක upload කරලා data restore කරන්න.<br>
                    අලුත් device එකේ browser එකේ මේ option එක use කරන්න.
                </p>
                <button class="btn btn-success btn-full" onclick="App.importData()" style="max-width:300px;margin:0 auto;">
                    <i class="fas fa-upload"></i> Upload & Restore
                </button>
            </div>
        </div>

        <div class="card">
            <h3 style="margin-bottom:12px;"><i class="fas fa-info-circle" style="color:var(--primary);"></i> Device මාරු කරන්නේ කොහොමද?</h3>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;text-align:center;padding:20px 0;">
                <div>
                    <div style="width:60px;height:60px;background:var(--primary-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">
                        <i class="fas fa-download" style="font-size:24px;color:var(--primary);"></i>
                    </div>
                    <h4>Step 1</h4>
                    <p style="font-size:13px;color:var(--gray);">පරණ device එකේ<br>"Download Backup" click කරන්න</p>
                </div>
                <div>
                    <div style="width:60px;height:60px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">
                        <i class="fas fa-exchange-alt" style="font-size:24px;color:var(--warning);"></i>
                    </div>
                    <h4>Step 2</h4>
                    <p style="font-size:13px;color:var(--gray);">JSON file එක අලුත් device එකට<br>copy කරන්න (email/drive/USB)</p>
                </div>
                <div>
                    <div style="width:60px;height:60px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">
                        <i class="fas fa-upload" style="font-size:24px;color:var(--success);"></i>
                    </div>
                    <h4>Step 3</h4>
                    <p style="font-size:13px;color:var(--gray);">අලුත් device එකේ<br>"Upload & Restore" click කරන්න</p>
                </div>
            </div>
        </div>
    `;
};
