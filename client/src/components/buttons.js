import React from "react"
import { ExternalLink, Star, Trash2 } from "react-feather"
import { Button } from "react-bootstrap"

const OpenExternalLinkButton = ({ link }) => {
    return (
        <Button
            variant="link"
            onClick={() =>
                window.open(link, "_blank")
            }
        >
            <ExternalLink />
        </Button>
    )
}

const FavoriteButton = ({ onClick, isFavorite }) => {
    return (
        <Button
            variant="link"
            onClick={onClick}
        >
            <Star
                style={{
                    fill: isFavorite ? "yellow" : "none",
                }}

            />
        </Button>
    )
}

const DeleteButton = ({ onClick }) => {
    return (
        <Button
            variant="link"
            onClick={onClick}
        >
            <Trash2 />
        </Button>
    )
}

export {
    OpenExternalLinkButton,
    FavoriteButton,
    DeleteButton
}