




export const metadata = {
  title: 'My Awesome Product 1',
  openGraph: {
    title: 'Super Cool Headphones 1',
    description: 'Crystal clear sound with deep bass. Buy now! 1',
    images: ['https://sathyamobiles.com/img/offer_products/qUdb0c84d6wRQsjh.png'],
    url: `${process.env.NEXT_PUBLIC_API_URL || "https://sathya.store"}/testme`,
    type: "website",
  },
}

export default function ProductPage() {
  return (
    <main>
      <h1>Super Cool Headphones 1</h1>
    </main>
  )
}