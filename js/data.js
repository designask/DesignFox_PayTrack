// ==========================================
// DATA LAYER - localStorage based
// ==========================================

const DB = {
    // Initialize with sample data if empty
    init() {
        if (!localStorage.getItem('pf_initialized')) {
            this.seed();
            localStorage.setItem('pf_initialized', 'true');
        }
    },

    seed() {
        const customers = [
            { id: this.uid(), name: 'Kasun Perera', email: 'kasun@techsol.lk', phone: '077 123 4567', company: 'TechSol Lanka', address: '45 Galle Road, Colombo 03', createdAt: '2025-01-15' },
            { id: this.uid(), name: 'Nimal Silva', email: 'nimal@webcraft.com', phone: '071 987 6543', company: 'WebCraft', address: '12 Kandy Road, Peradeniya', createdAt: '2025-02-20' },
            { id: this.uid(), name: 'Amara Fernando', email: 'amara@digitalx.io', phone: '076 555 1234', company: 'DigitalX Agency', address: '78 Marine Drive, Dehiwala', createdAt: '2025-03-10' },
        ];

        const quotations = [
            {
                id: this.uid(), number: 'QT-202501-001', customerId: customers[0].id,
                status: 'APPROVED', items: [
                    { service: 'Website Design', description: 'Modern responsive website', qty: 1, price: 150000, discount: 0, tax: 0 },
                    { service: 'SEO Setup', description: 'Initial SEO configuration', qty: 1, price: 50000, discount: 10, tax: 0 }
                ],
                total: 195000, notes: 'Includes 2 revisions', createdAt: '2025-01-20'
            },
            {
                id: this.uid(), number: 'QT-202502-002', customerId: customers[1].id,
                status: 'SENT', items: [
                    { service: 'Mobile App Design', description: 'iOS & Android UI/UX', qty: 1, price: 300000, discount: 5, tax: 0 }
                ],
                total: 285000, notes: '', createdAt: '2025-02-25'
            },
            {
                id: this.uid(), number: 'QT-202503-003', customerId: customers[2].id,
                status: 'DRAFT', items: [
                    { service: 'Brand Identity', description: 'Logo, Colors, Typography', qty: 1, price: 80000, discount: 0, tax: 0 },
                    { service: 'Business Cards', description: '500 pcs premium cards', qty: 1, price: 25000, discount: 0, tax: 0 }
                ],
                total: 105000, notes: 'Rush delivery needed', createdAt: '2025-03-15'
            }
        ];

        const invoices = [
            {
                id: this.uid(), number: 'INV-ADV-202501-001', quotationId: quotations[0].id,
                customerId: customers[0].id, type: 'ADVANCE', status: 'PAID',
                total: 97500, amountPaid: 97500, balance: 0,
                bankName: 'Commercial Bank', accountName: 'DesignFox Pvt Ltd',
                accountNumber: '8012345678', branch: 'Colombo 03',
                createdAt: '2025-01-22'
            }
        ];

        const payments = [
            {
                id: this.uid(), invoiceId: invoices[0].id, amount: 97500,
                method: 'BANK_TRANSFER', reference: 'TRF-98765',
                date: '2025-01-25', receiptNo: 'RCT-202501-001'
            }
        ];

        const projects = [
            {
                id: this.uid(), quotationId: quotations[0].id, customerId: customers[0].id,
                title: 'TechSol Website Redesign', createdAt: '2025-01-22',
                steps: [
                    { name: 'Quotation Approved', status: 'COMPLETED' },
                    { name: 'Advance Invoice Sent', status: 'COMPLETED' },
                    { name: 'Advance Payment Received', status: 'COMPLETED' },
                    { name: 'Work Started', status: 'IN_PROGRESS' },
                    { name: 'Project Completed', status: 'PENDING' },
                    { name: 'Final Invoice Sent', status: 'PENDING' },
                    { name: 'Balance Payment Received', status: 'PENDING' },
                    { name: 'Final Delivery Completed', status: 'PENDING' }
                ]
            }
        ];

        localStorage.setItem('pf_customers', JSON.stringify(customers));
        localStorage.setItem('pf_quotations', JSON.stringify(quotations));
        localStorage.setItem('pf_invoices', JSON.stringify(invoices));
        localStorage.setItem('pf_payments', JSON.stringify(payments));
        localStorage.setItem('pf_projects', JSON.stringify(projects));
    },

    uid() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    // CRUD Operations
    getAll(key) {
        return JSON.parse(localStorage.getItem(`pf_${key}`) || '[]');
    },

    getById(key, id) {
        const items = this.getAll(key);
        return items.find(i => i.id === id);
    },

    add(key, item) {
        const items = this.getAll(key);
        item.id = this.uid();
        item.createdAt = new Date().toISOString().split('T')[0];
        items.push(item);
        localStorage.setItem(`pf_${key}`, JSON.stringify(items));
        return item;
    },

    update(key, id, data) {
        let items = this.getAll(key);
        items = items.map(i => i.id === id ? { ...i, ...data } : i);
        localStorage.setItem(`pf_${key}`, JSON.stringify(items));
        return items.find(i => i.id === id);
    },

    delete(key, id) {
        let items = this.getAll(key);
        items = items.filter(i => i.id !== id);
        localStorage.setItem(`pf_${key}`, JSON.stringify(items));
    },

    // Helper functions
    getCustomerName(id) {
        const c = this.getById('customers', id);
        return c ? c.name : 'Unknown';
    },

    generateNumber(prefix) {
        const d = new Date();
        const ym = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`;
        const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
        return `${prefix}-${ym}-${rand}`;
    },

    // Stats
    getStats() {
        const quotations = this.getAll('quotations');
        const invoices = this.getAll('invoices');
        const payments = this.getAll('payments');
        const projects = this.getAll('projects');
        const customers = this.getAll('customers');

        const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
        const totalBalance = invoices.reduce((s, i) => s + (i.balance || 0), 0);
        const pendingInvoices = invoices.filter(i => i.status !== 'PAID').length;
        const completedProjects = projects.filter(p => p.steps && p.steps.every(s => s.status === 'COMPLETED')).length;

        return {
            totalQuotations: quotations.length,
            approvedQuotations: quotations.filter(q => q.status === 'APPROVED').length,
            pendingPayments: pendingInvoices,
            totalIncome: totalPaid,
            totalBalance,
            completedProjects,
            totalCustomers: customers.length,
            totalProjects: projects.length
        };
    }
};

// Initialize
DB.init();
