import Navbar from "../components/Navbar";
import Hero from "../sections/Hero";
import Ticker from "../components/Ticker";
import Stats from "../sections/Stats";
import FeatureShowcase from "../sections/FeatureShowcase";
import LimoAI from "../sections/LimoAI";
import LiquideOnePreview from "../sections/LiquideOnePreview";
import Footer from "../components/Footer";

const Home = () => {
    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />
            <Hero />
            <Ticker />
            <Stats />
            <FeatureShowcase />
            <LimoAI />
            <LiquideOnePreview />
            <Footer />
        </main>
    );
};

export default Home;
