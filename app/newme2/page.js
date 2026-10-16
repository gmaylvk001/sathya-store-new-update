



export const metadata = {
  title: 'new product',
  openGraph: {
    title: 'new product',
    description: 'new product',
    images: ['https://sathyamobiles.com/img/product/oIPmpsryJ0DW1wrF.jpg'],
    url: `${process.env.NEXT_PUBLIC_API_URL || "https://sathya.store"}/newme2`,
    type: "website",
  },
}

export default function ProductPage() {
  return (
    <main>
      <h1>product lastest</h1>
    </main>
  )
}