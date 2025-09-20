import { useState, useCallback } from 'react';
import Swal from 'sweetalert2'; // You might need to install sweetalert2: npm install sweetalert2
import 'sweetalert2/dist/sweetalert2.min.css'; // Import SweetAlert2 CSS

export const useConfirmation = () => {
    const [isOpen, setIsOpen] = useState(false);

    const confirm = useCallback(
        ({ title, message }) => {
            return new Promise((resolve) => {
                Swal.fire({
                    title: title || 'Are you sure?',
                    text: message || 'Are you sure you want to continue?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Continue',
                    cancelButtonText: 'Cancel',
                }).then((result) => {
                    if (result.isConfirmed) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
            });
        },
        []
    );

    return { confirm, isOpen };
};
