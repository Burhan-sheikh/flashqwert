import React from "react";

const PaymentTerms = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gray-300 py-5 px-6 sm:px-10">
          <h2 className="text-2xl font-extrabold text-gray-900">Payment Proof Terms & Conditions</h2>
          <p className="mt-1 text-md text-gray-500">Please read the following terms carefully before submitting your payment proof.</p>
        </div>

        <div className="p-6 sm:px-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">1. Submission Guidelines</h3>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>You must submit a clear and unedited screenshot of your payment.</li>
            <li>The screenshot should include the amount paid, UPI ID/bank details, date & time of the transaction, and transaction reference/UTR number.</li>
            <li>Ensure that the screenshot is not cropped, blurred, or missing any key details.</li>
            <li>The file size must be less than 700KB. Accepted formats are PNG and JPG.</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">2. Verification Process</h3>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Our team will review your payment proof within 24 hours.</li>
            <li>You will receive a notification once your payment is verified and your plan is activated.</li>
            <li>If your payment proof is rejected, you will be notified with a reason and instructions to resubmit.</li>
            <li>If your proof is not approved or rejected within 24 hours, the request auto-expires, and you must resubmit.</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">3. Reasons for Rejection</h3>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Unclear, cropped, or missing key details in the screenshot.</li>
            <li>Pending, failed, or incorrect transaction.</li>
            <li>Fake, reused, or edited screenshots.</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">4. Fraud Policy</h3>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Submitting fake, reused, or edited screenshots will result in a permanent ban from our platform.</li>
            <li>We watermark all proofs for internal verification purposes.</li>
            <li>Your IP address and device may be flagged for suspicious activity.</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">5. Contact Support</h3>
          <p className="text-gray-600 mb-4">If you have any questions or need assistance, please contact our support team at <a href="mailto:contact.flashqr@gmail.com" className="text-blue-600 hover:text-blue-800">contact.flashqr@gmail.com</a>.</p>

          <p className="text-gray-600">By submitting your payment proof, you acknowledge that you have read and agree to these terms and conditions.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentTerms;