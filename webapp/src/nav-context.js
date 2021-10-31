import { createContext } from "react";

const NavContext = createContext({
    currentPage: 'Home',
    setCurrentPage: () => {},
});

export default NavContext;