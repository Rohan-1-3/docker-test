import useTheme from "./hooks/useTheme";


function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <h1 className='text-red-500 dark:text-white bg-white dark:bg-black'>Hello World</h1>
      <button onClick={toggleTheme}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</button>
    </>
  )
}

export default App
