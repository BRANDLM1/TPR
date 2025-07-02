import InitMap from "./components/Map/InitMap"
import Hero from "./components/Hero"
export default function Home() {
  return(
    <div className="w-screen h-screen bg-blue-100 text-black">
      
      {/* Hero */}
      <Hero/>

      {/* Map */}
      <section className="h-[950px] w-450 mx-auto flex mt-20">
          <InitMap />
      </section>

    </div>
  );
}

