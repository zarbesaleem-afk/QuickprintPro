import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, ShopSettings } from '../types';
import { format } from 'date-fns';

const printPDF = (doc: jsPDF) => {
  doc.autoPrint();
  
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);
  
  iframe.src = url;
  
  iframe.onload = () => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    } catch (e) {
      console.warn("Direct iframe printing blocked, falling back to new window.");
      window.open(url, '_blank');
    }
    
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 2000);
  };
};

export const generateInvoicePDF = (order: Order, shop: ShopSettings, directPrint: boolean = false) => {
  const doc = new jsPDF();
  const margin = 20;
  
  doc.setFontSize(22);
  doc.setTextColor(67, 56, 202);
  doc.text(shop.name, margin, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(shop.address, margin, 38);
  doc.text(`Phone: ${shop.phone} | Email: ${shop.email}`, margin, 44);
  
  doc.setDrawColor(230);
  doc.line(margin, 55, 190, 55);
  
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('INVOICE', margin, 70);
  
  doc.setFontSize(10);
  doc.text(`Invoice #: ${order.invoiceNumber}`, margin, 80);
  doc.text(`Date: ${format(order.createdAt, 'dd MMM yyyy')}`, margin, 86);
  doc.text(`Delivery Date: ${format(order.deliveryDate, 'dd MMM yyyy')}`, margin, 92);
  doc.text(`Status: ${order.status.toUpperCase()}`, margin, 98);
  
  const col2 = 120;
  doc.setFontSize(12);
  doc.text('BILL TO:', col2, 70);
  doc.setFontSize(10);
  doc.text(order.customerName, col2, 80);
  doc.text(order.customerPhone, col2, 86);
  if (order.customerAddress) {
    doc.text(order.customerAddress, col2, 92, { maxWidth: 70 });
  }

  autoTable(doc, {
    startY: 110,
    head: [['Item / Service', 'Qty', 'Unit Price', 'Total']],
    body: order.items.map(item => [
      item.name,
      item.qty.toString(),
      `PKR ${item.unitPrice.toLocaleString()}`,
      `PKR ${item.lineTotal.toLocaleString()}`
    ]),
    headStyles: { fillColor: [67, 56, 202] },
    alternateRowStyles: { fillColor: [245, 247, 255] },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const leftPos = 130;
  
  doc.text(`Subtotal:`, leftPos, finalY);
  doc.text(`PKR ${order.subtotal.toLocaleString()}`, 170, finalY, { align: 'right' });
  
  doc.text(`Discount:`, leftPos, finalY + 6);
  doc.text(`PKR ${order.discount.toLocaleString()}`, 170, finalY + 6, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total:`, leftPos, finalY + 14);
  doc.text(`PKR ${order.total.toLocaleString()}`, 170, finalY + 14, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Paid Amount:`, leftPos, finalY + 22);
  doc.setTextColor(22, 163, 74);
  doc.text(`PKR ${order.paid.toLocaleString()}`, 170, finalY + 22, { align: 'right' });
  
  doc.setTextColor(0);
  doc.text(`Balance Due:`, leftPos, finalY + 28);
  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.text(`PKR ${order.due.toLocaleString()}`, 170, finalY + 28, { align: 'right' });

  doc.setTextColor(150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const footerY = 280;
  doc.text('Thank you for choosing QuickPrint PK!', 105, footerY, { align: 'center' });
  doc.text('This is a computer generated invoice.', 105, footerY + 5, { align: 'center' });

  if (directPrint) {
    printPDF(doc);
  } else {
    doc.save(`${order.invoiceNumber}.pdf`);
  }
};

export const generateReceiptToken = (order: Order, shop: ShopSettings, directPrint: boolean = false) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150]
  });

  doc.setFontSize(14);
  doc.text(shop.name, 40, 10, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text(`Token: ${order.invoiceNumber}`, 40, 16, { align: 'center' });
  doc.text(format(new Date(), 'dd/MM/yyyy HH:mm'), 40, 20, { align: 'center' });
  
  doc.line(5, 23, 75, 23);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER INFO', 5, 28);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${order.customerName}`, 5, 33);
  doc.text(`Phone: ${order.customerPhone}`, 5, 38);
  
  doc.line(5, 41, 75, 41);
  
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY ON:', 5, 46);
  doc.setFontSize(12);
  doc.text(format(order.deliveryDate, 'dd MMM yyyy'), 5, 52);
  
  doc.line(5, 55, 75, 55);
  
  doc.setFontSize(10);
  doc.text('PAYMENT SUMMARY', 5, 60);
  doc.text(`Total: PKR ${order.total}`, 5, 65);
  doc.text(`Paid: PKR ${order.paid}`, 5, 70);
  
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38);
  doc.text(`DUE: PKR ${order.due}`, 5, 80);
  
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.text('Please bring this slip for pickup', 40, 95, { align: 'center' });
  
  if (directPrint) {
    printPDF(doc);
  } else {
    doc.save(`${order.invoiceNumber}-Token.pdf`);
  }
};