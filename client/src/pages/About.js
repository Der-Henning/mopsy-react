import React, { Component } from "react";

export default class About extends Component {
  render() {
    return(
        <div style={{
            display: "flex",
            justifyContent: "center",
            width: "100%"
        }}>
            <div style={{
                width: "100%",
                maxWidth: "700px",
                padding: "20px"
            }}>
                MOPS-Y <i>Search</i> ist eine inoffizielle Suchmaschine, 
                welche ich zur Erleichterung meiner Arbeit entwickelt habe.
                <br/>
                Mit dieser Website stelle ich sie jedem zur Verfügung.
                <br/><br/>
                Entsprechend betreibe ich diese Website auf nicht regenerativer Hardware und
                kann diese nur bis Mitte 2021 betreiben. Sollte Interesse an einer Aufrechterhaltung
                dieses Dienstes bestehen, stelle ich gerne sämtliche digitalen Ressourcen zur 
                Verfügung.
                <br/><br/>
                <b>Kontakt:</b><br/>
                <a href="mailto:henningmerklinger@bundeswehr.org">KptLt Henning Merklinger</a><br/>
                90 2513 19400
            </div>
        </div>
    )
  }
}
