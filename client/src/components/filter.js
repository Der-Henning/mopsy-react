import React, { useCallback, useState } from "react"
import { useSearchData } from "../context";
import { Button } from "react-bootstrap"

const FilterButton = ({ facet, value }) => {
    const { filters, setFilters } = useSearchData();

    const style = {
        margin: "4px",
        padding: "3px 6px 3px 6px",
        borderRadius: "0.75rem"
    }

    const checkFilter = useCallback((filter) => {
        const count = filters.filter(value => {
            return value[0] === filter[0] && value[1] === filter[1]
        }).length
        if (count > 0) return true
        return false
    }, [filters])

    const toggleFilter = useCallback((filter) => {
        if (checkFilter(filter)) {
            setFilters((prevFilters) => (prevFilters.filter(value => {
                return value[0] !== filter[0] || value[1] !== filter[1]
            })))
        } else {
            setFilters((prevFilters) => ([...prevFilters, filter]))
        }
    }, [setFilters, checkFilter])

    return (
        <Button
            style={style}
            variant={checkFilter([facet, value]) ? "secondary" : "outline-secondary"}
            value={facet}
            onClick={() => { toggleFilter([facet, value]) }}>
            {value}
        </Button>
    )
}

const SmallFacet = ({setOpen}) => {
    const { filters } = useSearchData();

    return (
        <div style={{width: "100%", position: "relative"}}>
            <Button variant="link" onClick={() => setOpen(true)}>Filter</Button>
            {filters.map(f => (
                <FilterButton key={f[1]} facet={f[0]} value={f[1]} />
            ))}
        </div>
    )
}

const FullFacet = ({ facet }) => {
    const { facets } = useSearchData();

    if (facets[facet]["buckets"].length > 0)
        return (
            <div>
                <p style={{margin: "0.2rem"}}><strong>{facet}:</strong></p>
                {facets[facet]["buckets"].map(b =>
                (
                    <FilterButton key={b.val} facet={facet} value={b.val} />
                ))}
            </div>
        )
    return null
}

const Filter = (props) => {
    const { facets } = useSearchData();
    const [open, setOpen] = useState(false);

    if (facets) {
        delete facets.count
        delete facets.Creation
        if (open)
            return (
                <div>
                    {Object.keys(facets).map(f => (<FullFacet key={f} facet={f} />))}
                </div>
            )
        else
            return (
                <div>
                    <SmallFacet setOpen={setOpen}/>
                </div>
            )
    }
}

export default Filter;