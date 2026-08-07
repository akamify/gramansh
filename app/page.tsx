import HomepageClient from "./components/home/HomepageClient";

export const metadata = {
  title: "Gram Ansh - Cold Press Oil & Natural Masala",
  description:
    "Explore Gram Ansh for cold press oils and natural masalas made with a clean, traditional, kitchen-first philosophy.",
  keywords: [
    "gram ansh",
    "cold press oil",
    "natural masala",
    "traditional kitchen essentials",
  ],
};

export const revalidate = 300;

export default function HomeRoute() {
  return <HomepageClient />;
}
