import InitMap from "./components/Map/InitMap"
import Hero from "./components/Hero"
export default function Home() {
  return(
    <div className="w-screen min-h-screen bg-blue-100 text-black px-4">
      
      {/* Hero */}
      <Hero/>

      {/* Map */}
      <section className="w-full h-justify flex justify-center mt-20">
          <InitMap />
      </section>

    </div>
  );
}

