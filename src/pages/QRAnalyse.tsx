// QRAnalyse.tsx (new analytics page)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Eye, 
  Calendar, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet,
  TrendingUp,
  Clock,
  MapPin,
  BarChart3,
  Users,
  Activity,
  Shield,
  Timer,
  Target
} from 'lucide-react';
import { DynamicQRCodeData, isDynamicQR } from '../types/qrcode';
import { format, parseISO, subDays, startOfDay, endOfDay, isToday, isYesterday } from 'date-fns';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);


interface VisitData {
  id: string;
  qrCodeId: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  referrer?: string;
}

const QRAnalyse: React.FC = () => {
  const { qrCodeId } = useParams<{ qrCodeId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [qrCode, setQrCode] = useState<DynamicQRCodeData | null>(null);
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [selectedMetric, setSelectedMetric] = useState<'visits' | 'devices' | 'time'>('visits');

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !qrCodeId) {
        setError('Invalid request');
        setLoading(false);
        return;
      }

      try {
        // Try to find QR code by shortId first (for dynamic QRs)
        const qrQuery = query(
          collection(db, 'qrcodes'),
          where('shortId', '==', qrCodeId),
          where('userId', '==', user.uid),
          limit(1)
        );
        const qrQuerySnap = await getDocs(qrQuery);
        
        let qrData: any;
        
        if (!qrQuerySnap.empty) {
          const qrDoc = qrQuerySnap.docs[0];
          qrData = { id: qrDoc.id, ...qrDoc.data() };
        } else {
          // Fallback: try by document ID
          const qrRef = doc(db, 'qrcodes', qrCodeId);
          const qrSnap = await getDoc(qrRef);
          
          if (!qrSnap.exists()) {
            setError('QR code not found');
            return;
          }
          
          qrData = { id: qrSnap.id, ...qrSnap.data() };
        }
        
        // Verify ownership
        if (qrData.userId !== user.uid) {
          setError('Access denied');
          return;
        }

        // Verify it's a dynamic QR code
        if (qrData.type !== 'dynamic') {
          setError('Analytics are only available for dynamic QR codes');
          return;
        }

        setQrCode(qrData as DynamicQRCodeData);

        // Generate mock visit data for demonstration
        const mockVisits = generateMockVisitData(qrData.visits || 0, qrData.createdAt);
        setVisits(mockVisits);
      } catch (err: any) {
        setError(`Failed to load analytics: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, qrCodeId]);

  // Generate mock visit data for demonstration
  const generateMockVisitData = (totalVisits: number, createdAt: string): VisitData[] => {
    const visits: VisitData[] = [];
    const startDate = new Date(createdAt);
    const now = new Date();
    
    for (let i = 0; i < totalVisits; i++) {
      const randomDate = new Date(startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime()));
      const devices = ['mobile', 'desktop', 'tablet'];
      const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
      const countries = ['India', 'USA', 'UK', 'Canada', 'Australia'];
      
      visits.push({
        id: `visit_${i}`,
        qrCodeId: qrCodeId!,
        timestamp: randomDate.toISOString(),
        device: devices[Math.floor(Math.random() * devices.length)] as 'mobile' | 'tablet' | 'desktop',
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        city: 'City ' + (i % 10),
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mock User Agent',
      });
    }
    
    return visits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };
  const getFilteredVisits = () => {
    if (timeRange === 'all') return visits;
    
    const days = timeRange === '7d' ? 7 : 30;
    const cutoff = startOfDay(subDays(new Date(), days));
    
    return visits.filter(visit => 
      new Date(visit.timestamp) >= cutoff
    );
  };

  const getDeviceStats = () => {
    const filtered = getFilteredVisits();
    const deviceCounts = filtered.reduce((acc, visit) => {
      const device = visit.device || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return deviceCounts;
  };

  const getDailyVisits = () => {
    const filtered = getFilteredVisits();
    const dailyCounts = filtered.reduce((acc, visit) => {
      const date = format(parseISO(visit.timestamp), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return dailyCounts;
  };

  const getHourlyVisits = () => {
    const filtered = getFilteredVisits();
    const hourlyCounts = filtered.reduce((acc, visit) => {
      const hour = format(parseISO(visit.timestamp), 'HH');
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return hourlyCounts;
  };

  const getTopCountries = () => {
    const filtered = getFilteredVisits();
    const countryCounts = filtered.reduce((acc, visit) => {
      const country = visit.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Error</h3>
        <p className="text-red-600 text-center">{error}</p>
        <button
          onClick={() => navigate('/history')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to QR Codes
        </button>
      </div>
    );
  }

  if (!qrCode) {
    return null;
  }

  const filteredVisits = getFilteredVisits();
  const deviceStats = getDeviceStats();
  const dailyVisits = getDailyVisits();
  const hourlyVisits = getHourlyVisits();
  const topCountries = getTopCountries();
  const uniqueVisitors = new Set(filteredVisits.map(v => v.ipAddress)).size;

  // Chart data
  const lineChartData = {
    labels: Object.keys(dailyVisits).slice(-7).map(date => format(parseISO(date), 'MMM dd')),
    datasets: [
      {
        label: 'Daily Visits',
        data: Object.values(dailyVisits).slice(-7),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const deviceChartData = {
    labels: Object.keys(deviceStats).map(device => device.charAt(0).toUpperCase() + device.slice(1)),
    datasets: [
      {
        data: Object.values(deviceStats),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const hourlyChartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
    datasets: [
      {
        label: 'Hourly Visits',
        data: Array.from({ length: 24 }, (_, i) => hourlyVisits[i.toString().padStart(2, '0')] || 0),
        backgroundColor: 'rgba(147, 51, 234, 0.6)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 1,
      },
    ],
  };
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/history')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            {qrCode.name}
          </h1>
          <p className="text-gray-600">Dynamic QR Code Analytics Dashboard</p>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="mb-6">
        <div className="flex gap-2">
          {[
            { value: '7d', label: 'Last 7 days' },
            { value: '30d', label: 'Last 30 days' },
            { value: 'all', label: 'All time' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === option.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Visits</p>
              <p className="text-2xl font-bold text-gray-900">{filteredVisits.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredVisits.length > 0 && isToday(parseISO(filteredVisits[0].timestamp)) ? 'Today' : 
                 filteredVisits.length > 0 && isYesterday(parseISO(filteredVisits[0].timestamp)) ? 'Yesterday' : ''}
              </p>
            </div>
            <Eye className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Visitors</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueVisitors}</p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredVisits.length > 0 ? `${Math.round((uniqueVisitors / filteredVisits.length) * 100)}% unique` : ''}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mobile Visits</p>
              <p className="text-2xl font-bold text-gray-900">{deviceStats.mobile || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredVisits.length > 0 ? `${Math.round(((deviceStats.mobile || 0) / filteredVisits.length) * 100)}%` : '0%'}
              </p>
            </div>
            <Smartphone className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last Visit</p>
              <p className="text-sm font-medium text-gray-900">
                {filteredVisits.length > 0 
                  ? format(parseISO(filteredVisits[0].timestamp), 'MMM dd, HH:mm')
                  : 'Never'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredVisits.length > 0 && isToday(parseISO(filteredVisits[0].timestamp)) ? 'Today' : 
                 filteredVisits.length > 0 && isYesterday(parseISO(filteredVisits[0].timestamp)) ? 'Yesterday' : ''}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Metric Selector */}
      <div className="mb-6">
        <div className="flex gap-2">
          {[
            { value: 'visits', label: 'Visits Over Time', icon: TrendingUp },
            { value: 'devices', label: 'Device Breakdown', icon: Monitor },
            { value: 'time', label: 'Hourly Activity', icon: Clock }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedMetric(option.value as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === option.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <option.icon className="w-4 h-4" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedMetric === 'visits' ? 'Visits Over Time' :
             selectedMetric === 'devices' ? 'Device Breakdown' :
             'Hourly Activity Pattern'}
          </h3>
          <div className="h-64">
            {selectedMetric === 'visits' && (
              <Line 
                data={lineChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
              />
            )}
            {selectedMetric === 'devices' && (
              <Doughnut 
                data={deviceChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                  },
                }}
              />
            )}
            {selectedMetric === 'time' && (
              <Bar 
                data={hourlyChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Countries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
          <div className="space-y-3">
            {topCountries.map(([country, count]) => (
              <div key={country} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">{country}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Device Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Types</h3>
          <div className="space-y-3">
            {Object.entries(deviceStats).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {device === 'mobile' && <Smartphone className="w-4 h-4 text-blue-500" />}
                  {device === 'desktop' && <Monitor className="w-4 h-4 text-green-500" />}
                  {device === 'tablet' && <Tablet className="w-4 h-4 text-purple-500" />}
                  <span className="text-sm text-gray-600 capitalize">{device}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Advanced Features Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Features Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Scheduling</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                qrCode.scheduleEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {qrCode.scheduleEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">Scan Limits</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                qrCode.scanLimitEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {qrCode.scanLimitEnabled ? `${qrCode.maxScans || 0} max` : 'Unlimited'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600">Password</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                qrCode.passwordEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {qrCode.passwordEnabled ? 'Protected' : 'Open'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* QR Code Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Target URL:</span>
            <p className="font-medium text-gray-900 break-all">{qrCode.targetUrl}</p>
          </div>
          <div>
            <span className="text-gray-600">Short ID:</span>
            <p className="font-medium text-gray-900">{qrCode.shortId}</p>
          </div>
          <div>
            <span className="text-gray-600">Created:</span>
            <p className="font-medium text-gray-900">
              {format(parseISO(qrCode.createdAt), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Total Visits:</span>
            <p className="font-medium text-gray-900">{qrCode.visits || 0}</p>
          </div>
          {qrCode.scheduleEnabled && (
            <>
              <div>
                <span className="text-gray-600">Schedule:</span>
                <p className="font-medium text-gray-900">
                  {qrCode.scheduleStart && qrCode.scheduleEnd 
                    ? `${format(parseISO(qrCode.scheduleStart), 'MMM dd')} - ${format(parseISO(qrCode.scheduleEnd), 'MMM dd')}`
                    : 'Always active'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-600">Daily Hours:</span>
                <p className="font-medium text-gray-900">
                  {qrCode.dailyStartTime && qrCode.dailyEndTime 
                    ? `${qrCode.dailyStartTime} - ${qrCode.dailyEndTime}`
                    : '24/7'
                  }
                </p>
              </div>
            </>
          )}
          {qrCode.scanLimitEnabled && (
            <div>
              <span className="text-gray-600">Scan Progress:</span>
              <p className="font-medium text-gray-900">
                {qrCode.visits || 0} / {qrCode.maxScans || '∞'} scans
              </p>
            </div>
          )}
          {qrCode.tags && qrCode.tags.length > 0 && (
            <div className="md:col-span-2">
              <span className="text-gray-600">Tags:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {qrCode.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {qrCode.description && (
            <div className="md:col-span-2">
              <span className="text-gray-600">Description:</span>
              <p className="font-medium text-gray-900 mt-1">{qrCode.description}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default QRAnalyse;