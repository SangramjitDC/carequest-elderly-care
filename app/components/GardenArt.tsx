import { Flower2, Sun } from "lucide-react";

export function MiniGarden({ large = false }: { large?: boolean }) {
  return (
    <div className={`mini-garden ${large ? "mini-garden-large" : ""}`}>
      <div className="garden-sun"><Sun size={large ? 24 : 18} /></div>
      <span className="garden-cloud cloud-one" /><span className="garden-cloud cloud-two" />
      <div className="garden-hill hill-back" />
      <div className="garden-hill hill-front" />
      <div className="garden-plant plant-left"><span className="stem" /><span className="leaflet leaf-left" /><span className="leaflet leaf-right" /><Flower2 className="blossom" size={large ? 33 : 26} /></div>
      <div className="garden-plant plant-mid"><span className="stem" /><span className="leaflet leaf-left" /><span className="leaflet leaf-right" /><Flower2 className="blossom" size={large ? 42 : 30} /></div>
      <div className="garden-plant plant-right"><span className="stem" /><span className="leaflet leaf-left" /><span className="leaflet leaf-right" /><Flower2 className="blossom" size={large ? 30 : 23} /></div>
      <span className="garden-ground-flower flower-dot-one">✿</span><span className="garden-ground-flower flower-dot-two">✿</span>
      <div className="garden-quote"><span>✦</span> Every small step helps something grow.</div>
    </div>
  );
}

