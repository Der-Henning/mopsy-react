import React, { Component } from "react";

export default class About extends Component {
  render() {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            padding: "20px",
          }}
        >
          MOPS-Y <i>Search</i> ist eine inoffizielle Suchmaschine, welche ich
          zur Erleichterung meiner Arbeit entwickelt habe.
          <br />
          Mit dieser Website stelle ich sie jedem innerhalb des IntranetBw zur
          freien Nutzung zur Verfügung.
          <br />
          <br />
          Ich betreibe diese Website auf nicht regenerativer grüner Hardware und
          kann diese nur bis Mitte 2021 betreiben. Sollte Interesse an einer
          Aufrechterhaltung dieses Dienstes bestehen, stelle ich gerne sämtliche
          digitalen Ressourcen zur Verfügung.
          <br />
          <br />
          Hinweis zur Nutzung:
          <br />
          Grundsätzlich werden nur auf{" "}
          <a href="http://zrms.bundeswehr.org">zrms.bundeswehr.org</a>{" "}
          vorhandene PDF-Dokumente angezeigt. Alle weiteren Vorschriftentexte
          werden aus dem separat erstellten und in der Regel täglich
          aktualisierten Index erzeugt. Für deren Aktualität und Vollständigkeit
          kann keine Gewährleistung übernommen werden.
          <br />
          <br />
          Für angelegte Favoriten wird bei festgestellter Änderung des
          Dokumentes eine E-Mail Benachrichtigung an die vom Nutzer hinterlegte
          Adresse versandt. So ist es möglich auch Benachrichtigungen über
          Vorschriftenänderungen an OBKs zu erhalten. Für die durchgehende und
          vollständige Verfügbarkeit dieses Dienstes kann ebenfalls keine
          Gewährleistung übernommen werden.
          <br />
          <br />
          <b>Kontakt:</b>
          <br />
          <a href="mailto:henningmerklinger@bundeswehr.org">
            KptLt Henning Merklinger
          </a>
          <br />
          90 2513 19400
        </div>
      </div>
    );
  }
}
