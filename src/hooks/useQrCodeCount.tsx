// /home/project/src/hooks/useQrCodeCount.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import {
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';

const useQrCodeCount = () => {
    const { user } = useAuth();
    const [qrCodeCount, setQrCodeCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQrCodeCount = async () => {
            if (!user) {
                setQrCodeCount(0);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const qrcodesCollection = collection(db, 'qrcodes');
                const q = query(qrcodesCollection, where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);
                setQrCodeCount(querySnapshot.size);
            } catch (err: any) {
                setError(`Failed to fetch QR code count: ${err.message}`);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchQrCodeCount();
    }, [user]);

    return { qrCodeCount, loading, error };
};

export default useQrCodeCount;
