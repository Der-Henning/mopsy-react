import React from "react";
import {Container, Row, Col} from "react-bootstrap";
import {GitHub} from "react-feather";

const Footer = props => {


    return (
        <footer {...props}>
            <Container fluid className="footer">
                <Row>
                    <Col style={{textAlign: "right"}}>
                        <p style={{marginTop: "1rem"}}>© 2021 Henning Merklinger</p>
                        <p><a href="https://github.com/Der-Henning/mopsy-react" target="_blank" rel="noreferrer">
                            show on Github <GitHub />
                        </a></p>
                    </Col>
                </Row>
            </Container>
        </footer>
    )
}

export default Footer