// global utilities for table intended for AjaxUsers and AjaxReviews
// holds: doFilter, sortByProp, getArrow
// needs: filterObjList() and jsSort()

window.tableUtilities = (() => {
    // filter based on text input and reapplies sorting if there
    const doFilter = (dbList, filterInputVal, sortConfig) => {
        let newList = filterObjList(dbList, filterInputVal); // text filter all objects in list
        if (sortConfig.prop) {
            jsSort(newList, sortConfig.prop, sortConfig.sortType || "text");
            if (sortConfig.direction === "desc") newList.reverse();
        } // reapply sort
        return newList;
    };
    // sort list by prop name and type whenever clumn header is clicked
    const sortByProp = (filteredList, propName, sortType, sortConfig, setSortConfig) => {
        // copy the list to avoid mutating state directly
        let newList = [...filteredList];
        // default sort is ascending
        let newDirection = "asc";
        // sort by descending if column is cliked again
        if (sortConfig.prop === propName && sortConfig.direction === "asc") {
            newDirection = "desc";
        }
        jsSort(newList, propName, sortType); //sort list
        if (newDirection === "desc") newList.reverse(); //revrse list if cliked again
        setSortConfig({ prop: propName, direction: newDirection, sortType }); // update so arrows and ui update
        return newList;
    };
   
    const getArrow = (prop, sortConfig) => {
        if (sortConfig.prop !== prop) return "↕️"; //not sorted
        return sortConfig.direction === "asc" ? "⬆️" : "⬇️"; //asc if not then desc
    };
 
    return { doFilter, sortByProp, getArrow };
})();