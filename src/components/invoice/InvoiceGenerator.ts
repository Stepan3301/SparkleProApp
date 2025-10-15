// ✅ Dynamic import type - no direct import
type jsPDF = any;

// Invoice data interface
export interface InvoiceData {
  // Booking information
  bookingId: string;
  bookingNumber: string;
  serviceName: string;
  serviceDate: string;
  serviceTime: string;
  status: string;
  
  // Customer information
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  
  // Service details
  cleaners: number;
  hours: number;
  materials: string; // 'provided' or 'own'
  
  // Additional services
  additionalServices: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  
  // Pricing
  subtotal: number;
  vatAmount: number;
  cashFee: number;
  totalCost: number;
  
  // Dates
  createdAt: string;
  invoiceDate: string;
}

export class InvoiceGenerator {
  private doc: jsPDF | null = null;
  private pageWidth: number = 0;
  private pageHeight: number = 0;
  private margin: number = 20;
  private currentY: number = 20;
  private logoLoaded: boolean = false;

  // ✅ Initialize with dynamic import
  async init(): Promise<void> {
    const { default: jsPDFModule } = await import('jspdf');
    this.doc = new jsPDFModule('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.currentY = this.margin;
  }

  // Generate PDF invoice
  public async generateInvoice(data: InvoiceData): Promise<void> {
    if (!this.doc) {
      await this.init();
    }
    await this.addHeader(data);
    this.addCompanyAndCustomerInfo(data);
    this.addServiceDetailsTable(data);
    this.addFooter();
  }

  // Download the generated PDF
  public download(filename: string): void {
    if (!this.doc) throw new Error('PDF not initialized');
    this.doc.save(filename);
  }

  // Get PDF as blob for preview
  public getBlob(): Blob {
    if (!this.doc) throw new Error('PDF not initialized');
    return this.doc.output('blob');
  }

  private ensureDoc(): asserts this is { doc: jsPDF } {
    if (!this.doc) {
      throw new Error('PDF document not initialized. Call init() or generateInvoice() first.');
    }
  }

  private async addHeader(data: InvoiceData): Promise<void> {
    this.ensureDoc();
    // Professional header background - grey instead of green
    this.doc.setFillColor(156, 163, 175); // gray-400 for professional look
    this.doc.rect(0, 0, this.pageWidth, 30, 'F');
    
    // Add logo
    try {
      await this.addLogo();
    } catch (error) {
      console.warn('Could not load logo:', error);
    }
    
    // Company name - white text
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Sparkle New', 50, 15);
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('CLEANING SERVICE', 50, 22);
    
    // Invoice title and number - white text
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('INVOICE', this.pageWidth - 60, 12);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`#${data.bookingNumber}`, this.pageWidth - 60, 20);
    
    this.currentY = 40;
  }

  private async addLogo(): Promise<void> {
    this.ensureDoc();
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Calculate logo dimensions (maintain aspect ratio)
          const logoWidth = 20;
          const logoHeight = (img.height / img.width) * logoWidth;
          
          // Add logo to PDF
          this.doc!.addImage(img, 'PNG', this.margin, 5, logoWidth, logoHeight);
          this.logoLoaded = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load logo'));
      img.src = '/sparklepro-logo-removebg-preview.png';
    });
  }

  private addCompanyAndCustomerInfo(data: InvoiceData): void {
    this.ensureDoc();
    // Reset text color to black
    this.doc.setTextColor(0, 0, 0);
    
    // Company information (left side)
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Sparkle New Cleaning Service', this.margin, this.currentY);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text('Dubai, UAE', this.margin, this.currentY + 6);
    this.doc.text('Phone: +971 52 787 5006', this.margin, this.currentY + 12);
    this.doc.text('Email: sparklencs@gmail.com', this.margin, this.currentY + 18);
    this.doc.text('Website: www.sparklenew.com', this.margin, this.currentY + 24);
    
    // Customer information (right side)
    const rightX = this.pageWidth - 80;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.text('BILL TO:', rightX, this.currentY);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text(data.customerName, rightX, this.currentY + 6);
    this.doc.text(data.customerPhone, rightX, this.currentY + 12);
    
    // Split address into multiple lines if too long
    const addressLines = this.splitText(data.customerAddress, 50);
    addressLines.forEach((line, index) => {
      this.doc.text(line, rightX, this.currentY + 18 + (index * 6));
    });
    
    this.currentY += 40;
    
    // Invoice details section
    this.doc.setFillColor(248, 250, 252); // gray-50
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 20, 'F');
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.text('Invoice Date:', this.margin + 5, this.currentY + 7);
    this.doc.text('Service Date:', this.margin + 5, this.currentY + 14);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.invoiceDate, this.margin + 35, this.currentY + 7);
    this.doc.text(`${data.serviceDate} at ${data.serviceTime}`, this.margin + 35, this.currentY + 14);
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Status:', rightX, this.currentY + 7);
    this.doc.text('Payment:', rightX, this.currentY + 14);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.status.toUpperCase(), rightX + 20, this.currentY + 7);
    this.doc.text('Due on completion', rightX + 20, this.currentY + 14);
    
    this.currentY += 30;
  }

  private addServiceDetailsTable(data: InvoiceData): void {
    this.ensureDoc();
    // Table header - grey background to match header (taller to accommodate AED text)
    this.doc.setFillColor(156, 163, 175); // gray-400 to match header
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 15, 'F'); // Increased from 10 to 15
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    
    // Table headers - adjusted Y position for taller header
    this.doc.text('DESCRIPTION', this.margin + 3, this.currentY + 9);
    this.doc.text('QTY', this.margin + 80, this.currentY + 9);
    this.doc.text('RATE', this.margin + 100, this.currentY + 9);
    this.doc.text('AMOUNT', this.pageWidth - 35, this.currentY + 9);
    
    this.currentY += 20; // Increased from 15 to 20
    
    // Reset text color
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    // Main service row
    const mainServiceAmount = data.subtotal - data.additionalServices.reduce((sum, service) => sum + (service.price * (service.quantity || 1)), 0);
    
    this.addTableRow(
      data.serviceName,
      `${data.cleaners} cleaner${data.cleaners > 1 ? 's' : ''} × ${data.hours} hour${data.hours > 1 ? 's' : ''}${data.materials === 'provided' ? ' (materials included)' : ' (customer materials)'}`,
      '1',
      `${(mainServiceAmount / (data.cleaners * data.hours)).toFixed(2)} AED/hr/cleaner`,
      `${mainServiceAmount.toFixed(2)} AED`
    );
    
    // Additional services
    data.additionalServices.forEach((service) => {
      const quantity = service.quantity || 1;
      const total = service.price * quantity;
      
      this.addTableRow(
        service.name,
        'Additional cleaning service',
        quantity.toString(),
        `${service.price.toFixed(2)} AED`,
        `${total.toFixed(2)} AED`
      );
    });
    
    // Add some spacing
    this.currentY += 10;
    
    // Totals section
    this.addTotalsSection(data);
  }

  private addTableRow(title: string, description: string, qty: string, rate: string, amount: string): void {
    this.ensureDoc();
    // Alternating row colors
    if (Math.floor((this.currentY - 85) / 25) % 2 === 0) {
      this.doc.setFillColor(249, 250, 251); // gray-50
      this.doc.rect(this.margin, this.currentY - 2, this.pageWidth - (this.margin * 2), 20, 'F');
    }
    
    // Title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.text(title, this.margin + 3, this.currentY + 4);
    
    // Description
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    const descLines = this.splitText(description, 60);
    descLines.forEach((line, index) => {
      this.doc.text(line, this.margin + 3, this.currentY + 10 + (index * 4));
    });
    
    // Quantity, Rate, Amount
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text(qty, this.margin + 83, this.currentY + 4);
    this.doc.text(rate, this.margin + 103, this.currentY + 4);
    this.doc.text(amount, this.pageWidth - 35, this.currentY + 4);
    
    this.currentY += Math.max(15, descLines.length * 4 + 8);
    
    // Add line separator
    this.doc.setDrawColor(229, 231, 235); // gray-200
    this.doc.setLineWidth(0.2);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 5;
  }

  private addTotalsSection(data: InvoiceData): void {
    this.ensureDoc();
    const rightX = this.pageWidth - 80;
    
    // Calculate height needed for totals section
    let totalHeight = 45; // Base height
    if (data.cashFee > 0) {
      totalHeight += 8; // Add extra height for cash fee row
    }
    
    // Totals background - expanded to fit all information
    this.doc.setFillColor(248, 250, 252); // gray-50
    this.doc.rect(rightX - 15, this.currentY, 85, totalHeight, 'F'); // Expanded width from 70 to 85, added 5 more margin
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    // Subtotal
    this.doc.text('Subtotal:', rightX - 10, this.currentY + 8);
    this.doc.text(`${data.subtotal.toFixed(2)} AED`, rightX + 40, this.currentY + 8);
    
    // VAT
    this.doc.text('VAT (5%):', rightX - 10, this.currentY + 16);
    this.doc.text(`${data.vatAmount.toFixed(2)} AED`, rightX + 40, this.currentY + 16);
    
    // Cash fee (if applicable)
    if (data.cashFee > 0) {
      this.doc.text('Cash Fee:', rightX - 10, this.currentY + 24);
      this.doc.text(`${data.cashFee.toFixed(2)} AED`, rightX + 40, this.currentY + 24);
      this.currentY += 8;
    }
    
    // Total line
    this.doc.setDrawColor(156, 163, 175); // gray-400 to match theme
    this.doc.setLineWidth(1);
    this.doc.line(rightX - 10, this.currentY + 28, rightX + 55, this.currentY + 28);
    
    // Total amount
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(75, 85, 99); // gray-600 for professional look
    this.doc.text('TOTAL:', rightX - 10, this.currentY + 36);
    this.doc.text(`${data.totalCost.toFixed(2)} AED`, rightX + 40, this.currentY + 36);
    
    this.currentY += 55;
  }

  private addFooter(): void {
    this.ensureDoc();
    // Footer section
    this.currentY = this.pageHeight - 50;
    
    // Thank you section - grey background to match theme
    this.doc.setFillColor(156, 163, 175); // gray-400 to match header
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 25, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('Thank you for choosing Sparkle New Cleaning Service!', this.margin + 5, this.currentY + 8);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text('We appreciate your business and look forward to serving you again.', this.margin + 5, this.currentY + 16);
    
    // Terms and conditions
    this.currentY += 30;
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text('PAYMENT TERMS: Payment is due upon completion of service. Late payments may incur additional charges.', this.margin, this.currentY);
    this.doc.text('This invoice was generated electronically and is valid without signature.', this.margin, this.currentY + 4);
    this.doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')} | Invoice #${Math.random().toString(36).substr(2, 9).toUpperCase()}`, this.margin, this.currentY + 8);
  }

  private splitText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
}
