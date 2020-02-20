import React, { Component } from 'react';
import { Accordion, Card, Button } from 'react-bootstrap';
import Parser from 'html-react-parser';

class Results extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: props.data,
            activeDoc: props.activeDoc
        };
        this.handleClick = this.handleClick.bind(this);
    }

    cardBody(docId) {
        var pages = [];
        const highlights = this.props.data.highlighting[docId];
        for (let key in highlights) {
            if (key.split('_')[0] === 'page') {
                pages.push(
                    <tr key={key} className="card-tr">
                        <td>{key.split('_')[1]}</td><td>{Parser(highlights[key].join(' -- '))}</td>
                    </tr>
                )
            }
        }
        return(
            <table><tbody>{pages}</tbody></table>
        )
    }

    componentDidUpdate(prevProps) {
        if (prevProps.activeDoc !== this.props.activeDoc) this.setState({activeDoc: this.props.activeDoc});
    }

    getVal(doc, field) {
        const hl = this.props.data.highlighting;
        if (hl && hl[doc.id] && hl[doc.id][field]){
            return Parser(hl[doc.id][field][0]);
        }
        return doc[field];
    }

    handleClick(docId) {
        this.props.setActiveDoc((docId === this.state.activeDoc) ? null : docId);
      //  this.setState({activeDoc: (docId === this.state.activeDoc) ? null : docId});
    }

    render() {
        var docs = [];
        var data = this.props.data;
        if (data) docs = data.response.docs;
        if (docs.length > 0) {
            const Cards = docs.map((doc) =>
                <Card key={doc.id}>
                    <Card.Header>
                        <Accordion.Toggle as={Button} variant="link" eventKey={doc.id} onClick={this.handleClick.bind(null,doc.id)} >
                            {doc.document} - {doc.title}
                        </Accordion.Toggle>
                    </Card.Header>
                    <Accordion.Collapse eventKey={doc.id}>
                        <Card.Body>{this.cardBody(doc.id)}</Card.Body>
                    </Accordion.Collapse>
                </Card>
            );
            return(
                <React.Fragment>
                    <Accordion activeKey={this.state.activeDoc} >
                        {Cards}
                    </Accordion>
                </React.Fragment>
            )
        } else return(
            <React.Fragment></React.Fragment>
        );
    }
}

export default Results;