const Background=({children}:{children: React.ReactNode})=>{
    const pageStyle: React.CSSProperties ={
    width: "100vw",
    minHeight: "100vh",
    background: "linear-gradient(to top right, #c3b39f, #f0c289)",
    display: "flex",
    flexDirection: "column"
    };
    return <div style={pageStyle}>{children}</div>
};
export default Background;