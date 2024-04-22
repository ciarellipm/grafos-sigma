import { useEffect } from 'react';
import Graph from "graphology";
import { cropToLargestConnectedComponent } from "graphology-components";
import forceAtlas2 from "graphology-layout-forceatlas2";
import circular from "graphology-layout/circular";
import Papa from "papaparse";
import Sigma from "sigma";
import chroma from 'chroma-js';



import { NodeBorderProgram } from "@sigma/node-border"
import circlepack from "graphology-layout/circlepack";
import louvain from "graphology-communities-louvain";


//ttps://mdl.library.utoronto.ca/technology/tutorials/visualizing-network-dataset-using-gephi --> Mini manual do Gephi
//https://www.sigmajs.org/storybook/?path=/story/node-image--node-images
//https://www.sigmajs.org/storybook/?path=/story/cluster-label--story
//https://www.sigmajs.org/storybook/?path=/story/use-reducers--story
//https://github.com/jacomyal/sigma.js/blob/deprecated-v0.1/src/core/plotter.js --> alterar tamanho da letra propocional ao tamanho do nó

export const App = () => {

  let renderer: Sigma | null = null;

  useEffect(() => {
    const fetchData = async () => {
      const url = '/data/data.csv';

      try {
        // Verify if the file exists
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("ERROR: file not found!");
        }

        // Load CSV file
        const csvData = await response.text();

        const textShow = document.getElementById("text") as HTMLElement;
        textShow.innerText = csvData;

        Papa.parse(csvData, {
          header: true,
          delimiter: ",",
          dynamicTyping: true,
          complete: (results) => {
            const graph = new Graph();

            // Build the graph by creating it's nodes and edges
            // results.data.forEach((line: any) => {
            //   const author = line.Username;
            //   const isRetweet = line.Retweets >= 1;
            //   const retweetedBy = isRetweet ? line['Name'] : null;

            //   if (retweetedBy) {
            //     if (!graph.hasNode(author))             graph.addNode(author, { label: author });
            //     if (!graph.hasNode(retweetedBy))        graph.addNode(retweetedBy, { label: retweetedBy });
            //     if(!graph.hasEdge(retweetedBy, author)) graph.addEdge(retweetedBy, author);
            //   }
            // });


            // // TEST 
            // results.data.forEach((line: any) => {
            //   const name = line.Name;
            //   const friend = line.Friend;
            //   //console.log(`Nome: ${name}, Amigo: ${friend}`);

            //   if (!graph.hasNode(name)) graph.addNode(name, { label: name });
            //   if (!graph.hasNode(friend)) graph.addNode(friend, { label: friend });
            //   if (!graph.hasEdge(name, friend)) graph.addEdge(name, friend);
            // });

            //Import data in json extension to build a graph
            const data = require("./data.json")
            graph.import(data);

            // Only keep the main connected component
            cropToLargestConnectedComponent(graph);

            // Use degrees for node sizes
            const degrees = graph.nodes().map((node) => graph.degree(node));
            const minDegree = Math.min(...degrees);
            const maxDegree = Math.max(...degrees);
            const minSize = 2;
            const maxSize = 150;
            graph.forEachNode((node) => {
              const degree = graph.degree(node);
              graph.setNodeAttribute(
                node,
                "size",
                minSize + ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize),
              );
            });

            // // Create a color scale with chroma.js to represent the nodes
            // const scale = chroma.scale(['#91DFEB', '#A29CE6']).domain([minDegree, maxDegree]);

            // // Add colors to the nodes, based it's quantity of edges 
            // graph.forEachNode((node) => {
            //   const degree = graph.degree(node);
            //   const color = scale(degree).hex();
            //   graph.setNodeAttribute(node, 'color', color);
            //   // console.log(`Node ${node} - Degree: ${degree} - Color: ${color}`);
            // });

            // Position nodes on a circle, then run Force Atlas 2 for a while to get proper graph layout
            circular.assign(graph);
            const settings = forceAtlas2.inferSettings(graph);
            forceAtlas2.assign(graph, { settings, iterations: 600 });


            //Find out communities in the graph and give a different color for each 
            louvain.assign(graph, {resolution: 1});
            let details = louvain.detailed(graph);

            const colors: Record<number, number> = {};
            for (let i = 0; i < details.count; i++){
              colors[i] = Math.random() * 16777215; //"#" + Math.floor(Math.random() * 16777215).toString(16);
            }

            for (let element in details.communities) {
              graph.mergeNodeAttributes(element, {
                //size: graph.degree(node) / 3,
                //label: `Node n°${++i}, in cluster n°${details.communities[element]}`,
                color: "#" + Math.floor(colors[details.communities[element]] + graph.getNodeAttribute(element,'size')).toString(16),
                borderColor: "black",
                //labelSize: graph.getNodeAttribute(element,'size'),
                community: details.communities[element]
              });
            }

            //Nodes are visually clustered by the community 
            circlepack.assign(graph, {
              hierarchyAttributes: ["community"],
            });

            // Hide the loader from the DOM
            const loader = document.getElementById("loader") as HTMLElement;
            if (loader) loader.style.display = "none";

            // Draw the final graph using sigma 
            const container = document.getElementById("container") as HTMLElement;
            if (renderer === null) renderer = new Sigma(graph, container, {
              defaultNodeType: "bordered",
                nodeProgramClasses: {
                  bordered: NodeBorderProgram,
                },
            });

            // Bind labels threshold to range input
            const labelsThresholdRange = document.getElementById("labels-threshold") as HTMLInputElement;
            labelsThresholdRange.addEventListener("input", () => {
              renderer?.setSetting("labelRenderedSizeThreshold", +labelsThresholdRange.value);
            });

            // Set proper range initial value:
            labelsThresholdRange.value = renderer.getSetting("labelRenderedSizeThreshold") + "";

          },
        });
      } catch (error) {
        console.error("ERROR: could not access the file!", error);
      }

    };

    fetchData();

  }, []);

  return (
    <div>
      <div id="loader">Loading ...</div>
      <div id="sigma-container"></div>
      <div id="text"></div>
    </div>
  );
}




