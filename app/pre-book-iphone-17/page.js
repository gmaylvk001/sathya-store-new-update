// app/terms/page.js  (App Router)
// or pages/terms.js (Pages Router)

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-center mb-6">
        iPhone 17 Pre-Booking Terms & Conditions
      </h1>
      <p className="text-center text-gray-600 mb-10">
        These Terms & Conditions govern the pre-booking of the iPhone 17 through{" "}
        <span className="font-semibold">Sathya Stores</span>.
        By placing a pre-booking order, you agree to these Terms.
      </p>

      <div className="bg-white shadow-lg rounded-2xl p-8 space-y-8">
        {[
          {
            title: "1. Pre-Booking Amount",
            points: [
              "An amount of ₹5000 is required to reserve your iPhone 17.",
              "This amount will be adjusted against the final price of the product at the time of purchase.",
              "Pre-booking can be made through bank transfer/UPI/ Credit card (no other payment modes are accepted)."
            ]
          },
          {
            title: "2. Booking Confirmation",
            points: [
              "Once the pre-booking amount is received, you will get a booking confirmation receipt via email/SMS.",
              "Pre-booking does not guarantee a specific model, color, or storage variant; allocation depends on availability."
            ]
          },
          {
            title: "3. Balance Payment",
            points: [
              "The remaining balance must be paid at the time of delivery/dispatch.",
              "If the balance payment is not made within the stipulated time (notified by us), your booking may be cancelled."
            ]
          },
          {
            title: "4. Delivery & Allocation",
            points: [
              "Delivery timelines depend on Apple’s official launch and stock availability.",
              "We will inform you of the expected delivery schedule once stock is allocated.",
              "Orders will be fulfilled on a first-come, first-served basis based on booking date."
            ]
          },
          {
            title: "5. Cancellation & Refund Policy",
            points: [
              "If we are unable to deliver the iPhone 17 due to stock unavailability or any unforeseen circumstances, we will issue a 100% refund of the pre-booking amount."
            ]
          },
          {
            title: "6. Price & Variants",
            points: [
              "The final price of the iPhone 17 will be as per Apple’s official launch price in India.",
              "Pre-booking does not lock the price; customers will pay the prevailing official price at the time of delivery."
            ]
          },
          {
            title: "7. Warranty",
            points: [
              "iPhone 17 will be covered by Apple’s standard 1-year limited warranty from the date of invoice.",
              "Warranty claims can be availed at any Apple Authorized Service Center."
            ]
          },
          {
            title: "8. Liability",
            points: [
              "We are not responsible for delays caused by Apple’s launch schedules, government restrictions, logistics issues, or other events beyond our control.",
              "Our maximum liability is limited to the refund of the pre-booking amount in case of non-fulfillment."
            ]
          },
          {
            title: "9. Governing Law",
            points: [
              "These Terms are governed by the laws of India.",
              "Any disputes will be subject to the jurisdiction of courts at Coimbatore."
            ]
          },
          {
            title: "10. Contact Us",
            points: [
              "CORPORATE OFFICE",
              "26/1 Dr.ALAGAPPA CHETTIYAR ROAD, TATABAD, NEAR KOVAI SCAN CENTRE,",
              "COIMBATORE – 641012",
              "📞 9842344323, 0422 2491222, 9965548664"
            ]
          }
        ].map((section, idx) => (
          <div key={idx} className="border-b border-gray-200 pb-6 last:border-none">
            <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {section.points.map((point, pIdx) => (
                <li key={pIdx}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  )
}
