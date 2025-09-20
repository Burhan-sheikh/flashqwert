import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    doc,
    getDoc,
} from 'firebase/firestore';
import {
    Download,
    Filter,
    Calendar,
    CreditCard,
    Package,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    FileText,
    Search,
    RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify'; // Import toast

interface PaymentRecord {
    id: string;
    userId: string;
    userEmail: string;
    planName: string;
    quantity?: number;
    price: number;
    transactionId?: string;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    createdAt: Date;
    proofImageBase64?: string;
}

interface UsageStats {
    totalPayments: number;
    totalSpent: number;
    approvedPayments: number;
    pendingPayments: number;
    rejectedPayments: number;
}

// Define plan prices here (since they're not in the database)
const planPrices: { [key: string]: number } = {
    Basic: 599,
    Standard: 1599,
    Premium: 1999,
};

const UsageAndPayment: React.FC = () => {
    const { user } = useAuth();
    const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [usageStats, setUsageStats] = useState<UsageStats>({
        totalPayments: 0,
        totalSpent: 0,
        approvedPayments: 0,
        pendingPayments: 0,
        rejectedPayments: 0,
    });

    // Filter states
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [customDateRange, setCustomDateRange] = useState({
        start: '',
        end: '',
    });

    // UI states
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(null);

    const fetchPaymentRecords = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const q = query(
                collection(db, 'paymentProofs'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            const records: PaymentRecord[] = snapshot.docs.map(doc => {
                const data = doc.data();
                let price = Number(data.price || 0);
                // If it's a plan and the price is 0 (or missing), get it from planPrices
                if (data.planName !== 'Quota' && (!data.price || data.price === 0)) {
                    price = planPrices[data.planName] || 0; // Use planPrices if available
                }
                return {
                    id: doc.id,
                    ...data,
                    price: price, // Ensure price is a number, default to 0 if missing
                    createdAt: data.createdAt?.toDate() || new Date(),
                } as PaymentRecord;
            });

            setPaymentRecords(records);

        } catch (err: any) {
            console.error('Error fetching payment records:', err);
            setError('Failed to load payment records. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchPaymentRecords();
        }
    }, [user, fetchPaymentRecords]);

    // Apply filters
    useEffect(() => {
        let filtered = [...paymentRecords];

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(record => record.status === statusFilter);
        }

        // Type filter
        if (typeFilter !== 'all') {
            if (typeFilter === 'plan') {
                filtered = filtered.filter(record => record.planName !== 'Quota');
            } else if (typeFilter === 'quota') {
                filtered = filtered.filter(record => record.planName === 'Quota');
            }
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const today = startOfDay(now);

            switch (dateFilter) {
                case 'today':
                    filtered = filtered.filter(record =>
                        isAfter(record.createdAt, today) && isBefore(record.createdAt, endOfDay(now))
                    );
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    filtered = filtered.filter(record => isAfter(record.createdAt, weekAgo));
                    break;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    filtered = filtered.filter(record => isAfter(record.createdAt, monthAgo));
                    break;
                case 'custom':
                    if (customDateRange.start && customDateRange.end) {
                        const startDate = startOfDay(parseISO(customDateRange.start));
                        const endDate = endOfDay(parseISO(customDateRange.end));
                        filtered = filtered.filter(record =>
                            isAfter(record.createdAt, startDate) && isBefore(record.createdAt, endDate)
                        );
                    }
                    break;
            }
        }

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(record =>
                record.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredRecords(filtered);
    }, [paymentRecords, statusFilter, typeFilter, dateFilter, searchTerm, customDateRange]);

    // Recalculate usage stats whenever filteredRecords change
    useEffect(() => {
        const calculateStats = () => {
            const stats: UsageStats = {
                totalPayments: filteredRecords.length,
                totalSpent: filteredRecords
                    .filter(r => r.status === 'approved')
                    .reduce((sum, r) => {
                        console.log(`Record: ${r.planName}, Price: ${r.price}`);  // Debugging
                        return sum + r.price;
                    }, 0),
                approvedPayments: filteredRecords.filter(r => r.status === 'approved').length,
                pendingPayments: filteredRecords.filter(r => r.status === 'pending').length,
                rejectedPayments: filteredRecords.filter(r => r.status === 'rejected').length,
            };
            setUsageStats(stats);
        };

        calculateStats();
    }, [filteredRecords]);

    const getStatusIcon = (status: string, createdAt: Date) => {
        const isExpired = isRequestExpired(createdAt);

        if (status === 'pending' && isExpired) {
            return <AlertTriangle className="w-5 h-5 text-red-500" />;
        }

        switch (status) {
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'approved':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string, createdAt: Date) => {
        const isExpired = isRequestExpired(createdAt);

        if (status === 'pending' && isExpired) {
            return 'bg-red-50 text-red-700 border-red-200';
        }

        switch (status) {
            case 'pending':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'approved':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'rejected':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const isRequestExpired = (createdAt: Date) => {
        const now = new Date();
        const timeDiff = now.getTime() - createdAt.getTime();
        return timeDiff > 24 * 60 * 60 * 1000; // 24 hours
    };

    const downloadReceipt = (record: PaymentRecord) => {
        try {
            const pdf = new jsPDF();

            // Header
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text('FlashQR Payment Receipt', 20, 30);

            // Receipt details
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');

            const details = [
                `Receipt ID: ${record.id}`,
                `Date: ${format(record.createdAt, 'PPP')}`,
                `Email: ${record.userEmail}`,
                `Type: ${record.planName === 'Quota' ? `Quota (${record.quantity} QR codes)` : `${record.planName} Plan`}`,
                `Amount: ₹${record.price}`,
                `Transaction ID: ${record.transactionId || 'N/A'}`,
                `Status: ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}`,
            ];

            let yPosition = 50;
            details.forEach(detail => {
                pdf.text(detail, 20, yPosition);
                yPosition += 10;
            });

            // Footer
            pdf.setFontSize(10);
            pdf.text('Generated by FlashQR', 20, 280);
            pdf.text(`Generated on: ${format(new Date(), 'PPP')}`, 20, 290);

            pdf.save(`FlashQR_Receipt_${record.id}.pdf`);
            toast.success('Receipt downloaded successfully!');
        } catch (error) {
            console.error("Error generating or downloading PDF:", error);
            toast.error('Failed to download receipt. Please try again.');
        }
    };

    const downloadAllRecords = () => {
        const pdf = new jsPDF();

        // Header
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('FlashQR Payment History', 20, 20);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated on: ${format(new Date(), 'PPP')}`, 20, 30);
        pdf.text(`Total Records: ${filteredRecords.length}`, 20, 40);

        // Table headers
        let yPosition = 60;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Date', 20, yPosition);
        pdf.text('Type', 60, yPosition);
        pdf.text('Amount', 100, yPosition);
        pdf.text('Status', 140, yPosition);

        yPosition += 10;
        pdf.setFont('helvetica', 'normal');

        // Records
        filteredRecords.forEach(record => {
            if (yPosition > 270) {
                pdf.addPage();
                yPosition = 20;
            }

            pdf.text(format(record.createdAt, 'dd/MM/yyyy'), 20, yPosition);
            pdf.text(record.planName === 'Quota' ? `Quota (${record.quantity})` : record.planName, 60, yPosition);
            pdf.text(`₹${record.price}`, 100, yPosition);
            pdf.text(record.status, 140, yPosition);

            yPosition += 8;
        });

        pdf.save(`FlashQR_Payment_History_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast.success('Payment history downloaded successfully!');
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-gray-600">Loading payment records...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <AlertTriangle className="w-12 h-12 text-red-500" />
                <p className="text-red-600 text-center">{error}</p>
                <button
                    onClick={fetchPaymentRecords}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Usage & Payments</h1>
                        <p className="text-gray-600">Track your payment history and usage statistics</p>
                    </div>
                    <button
                        onClick={fetchPaymentRecords}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Payments</p>
                                <p className="text-2xl font-bold text-gray-900">{usageStats.totalPayments}</p>
                            </div>
                            <CreditCard className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Spent</p>
                                <p className="text-2xl font-bold text-gray-900">₹{usageStats.totalSpent}</p>
                            </div>
                            <Package className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Approved</p>
                                <p className="text-2xl font-bold text-green-600">{usageStats.approvedPayments}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">{usageStats.pendingPayments}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Payment Records</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                            </button>
                            {filteredRecords.length > 0 && (
                                <button
                                    onClick={downloadAllRecords}
                                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Export All
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-b border-gray-200 p-4 space-y-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </div>

                                {/* Type Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="plan">Plan Subscriptions</option>
                                        <option value="quota">Quota Purchases</option>
                                    </select>
                                </div>

                                {/* Date Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                                    <select
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">Last 7 Days</option>
                                        <option value="month">Last 30 Days</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>

                                {/* Search */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search records..."
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Custom Date Range */}
                            {dateFilter === 'custom' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={customDateRange.start}
                                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={customDateRange.end}
                                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Records List */}
                <div className="p-4">
                    {filteredRecords.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No payment records found</h3>
                            <p className="text-gray-500">
                                {paymentRecords.length === 0
                                    ? "You haven't made any payments yet."
                                    : "No records match your current filters."
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredRecords.map((record) => {
                                const isExpired = isRequestExpired(record.createdAt);
                                const statusColor = getStatusColor(record.status, record.createdAt);
                                // Display the price, getting it from planPrices if needed
                                const displayPrice = record.planName !== 'Quota' ? (planPrices[record.planName] || record.price) : record.price;

                                return (
                                    <motion.div
                                        key={record.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${statusColor}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(record.status, record.createdAt)}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-gray-900">
                                                            {record.planName === 'Quota'
                                                                ? `Quota Purchase (${record.quantity} QR codes)`
                                                                : `${record.planName} Plan`
                                                            }
                                                        </h4>
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColor}`}>
                                                            {isExpired && record.status === 'pending' ? 'Expired' : record.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {format(record.createdAt, 'PPP')} • ₹{displayPrice}
                                                        {record.transactionId && ` • ${record.transactionId}`}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {record.proofImageBase64 && (
                                                    <button
                                                        onClick={() => setSelectedRecord(record)}
                                                        className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                                        title="View proof"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => downloadReceipt(record)}
                                                    className="p-2 text-gray-500 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                                                        title="Download receipt"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Payment Proof Modal */}
                    <AnimatePresence>
                        {selectedRecord && (
                            <motion.div
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedRecord(null)}
                            >
                                <motion.div
                                    className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-gray-900">Payment Proof</h3>
                                            <button
                                                onClick={() => setSelectedRecord(null)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <XCircle className="w-5 h-5 text-gray-500" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 overflow-y-auto max-h-[70vh]">
                                        {selectedRecord.proofImageBase64 && (
                                            <img
                                                src={selectedRecord.proofImageBase64}
                                                alt="Payment Proof"
                                                className="w-full rounded-lg border border-gray-200"
                                            />
                                        )}

                                        <div className="mt-4 space-y-2 text-sm text-gray-600">
                                            <p><strong>Type:</strong> {selectedRecord.planName === 'Quota' ? `Quota (${selectedRecord.quantity})` : selectedRecord.planName}</p>
                                            <p><strong>Amount:</strong> ₹{selectedRecord.price}</p>
                                            <p><strong>Date:</strong> {format(selectedRecord.createdAt, 'PPP')}</p>
                                            <p><strong>Status:</strong> {selectedRecord.status}</p>
                                            {selectedRecord.transactionId && (
                                                <p><strong>Transaction ID:</strong> {selectedRecord.transactionId}</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
        </div>
            );
        };

        export default UsageAndPayment;
