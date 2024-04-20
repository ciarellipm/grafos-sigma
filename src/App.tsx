import { useEffect } from 'react';
import Graph from "graphology";
import { cropToLargestConnectedComponent } from "graphology-components";
import forceAtlas2 from "graphology-layout-forceatlas2";
import circular from "graphology-layout/circular";
import Papa from "papaparse";
import Sigma from "sigma";
import chroma from 'chroma-js';


export const App = () => {
  let renderer: Sigma | null = null;

  const graph = new Graph();
  graph.addNode("1", { label: "Node 1", x: 0, y: 0, size: 10, color: "blue" });
  graph.addNode("2", { label: "Node 2", x: 1, y: 1, size: 20, color: "red" });
  graph.addEdge("1", "2", { size: 5, color: "purple" });

  //const renderer = new Sigma(
  //  graph,
  //  document.getElementById("sigma") as HTMLDivElement
  //);

  // Hide the loader from the DOM
  const loader = document.getElementById("root") as HTMLElement;
  if (loader) loader.style.display = "none";

  // Draw the final graph using sigma 
  const container = document.getElementById("sigma") as HTMLElement;
  if (renderer === null) renderer = new Sigma(graph, container, { allowInvalidContainer: true });

  return (
    <div>
      <div id="loader">Loading...</div>
    </div>
  );
}





