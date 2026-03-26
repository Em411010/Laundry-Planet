import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'

const FeatureSearch = ({ items }) => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const filtered = query.trim()
    ? items.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        (item.desc && item.desc.toLowerCase().includes(query.toLowerCase()))
      )
    : items

  useEffect(() => { setHighlighted(0) }, [query])

  // Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 0)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const goTo = (path) => {
    navigate(path)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && filtered[highlighted]) {
      goTo(filtered[highlighted].path)
    }
  }

  const handleOpen = () => {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Collapsed: icon button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="btn btn-ghost btn-sm gap-1.5"
          title="Search features (Ctrl+K)"
        >
          <Search size={17} />
          <span className="hidden lg:inline text-xs text-base-content/40 font-normal border border-base-300 rounded px-1 py-0.5">Ctrl+K</span>
        </button>
      )}

      {/* Expanded: input + dropdown */}
      {open && (
        <div className="flex items-center gap-1">
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search features..."
              className="input input-bordered input-sm pl-8 pr-7 w-44 md:w-60 focus:outline-primary"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <button
            onClick={() => { setOpen(false); setQuery('') }}
            className="btn btn-ghost btn-sm btn-square"
          >
            <X size={17} />
          </button>

          {/* Results dropdown */}
          {filtered.length > 0 && (
            <div className="absolute top-full right-0 mt-1 w-72 bg-base-100 border border-base-300 rounded-box shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
              {!query.trim() && (
                <p className="px-4 pt-3 pb-1 text-xs text-base-content/40 font-medium uppercase tracking-wide">All Features</p>
              )}
              {filtered.map((item, i) => (
                <button
                  key={item.path + item.label}
                  onClick={() => goTo(item.path)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === highlighted ? 'bg-primary/10' : 'hover:bg-base-200'}`}
                >
                  {item.icon && (
                    <span className={`flex-shrink-0 ${i === highlighted ? 'text-primary' : 'text-base-content/50'}`}>
                      <item.icon size={16} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    {item.desc && <p className="text-xs text-base-content/50 truncate">{item.desc}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.trim() && filtered.length === 0 && (
            <div className="absolute top-full right-0 mt-1 w-64 bg-base-100 border border-base-300 rounded-box shadow-2xl z-50 p-4 text-center">
              <p className="text-sm text-base-content/50">No results for <span className="font-medium">"{query}"</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FeatureSearch
