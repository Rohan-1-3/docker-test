import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { userService } from '../services/api';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Get window size for responsive pagination
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate items per page based on window size
  const getItemsPerPage = useCallback(() => {
    if (windowWidth < 640) return 5; // sm: 5 items
    if (windowWidth < 768) return 8; // md: 8 items
    if (windowWidth < 1024) return 10; // lg: 10 items
    return 12; // xl: 12 items
  }, [windowWidth]);

  // Get current filters from URL
  const getCurrentFilters = useCallback(() => {
    return {
      page: parseInt(searchParams.get('page')) || 1,
      limit: parseInt(searchParams.get('limit')) || getItemsPerPage(),
      search: searchParams.get('search') || '',
      sortBy: searchParams.get('sortBy') || 'firstName',
      sortOrder: searchParams.get('sortOrder') || 'asc',
      isActive: searchParams.get('isActive') || '',
      city: searchParams.get('city') || '',
      state: searchParams.get('state') || '',
      country: searchParams.get('country') || '',
      occupation: searchParams.get('occupation') || '',
      company: searchParams.get('company') || ''
    };
  }, [searchParams, getItemsPerPage]);

  // Update URL params
  const updateFilters = useCallback((newFilters) => {
    const filters = { ...getCurrentFilters(), ...newFilters };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
      if (!filters[key] || filters[key] === '') {
        delete filters[key];
      }
    });

    // Reset to page 1 when filters change (except when just changing page)
    if (!newFilters.page && Object.keys(newFilters).length > 0) {
      filters.page = 1;
    }

    setSearchParams(filters);
  }, [getCurrentFilters, setSearchParams]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = getCurrentFilters();
      const data = await userService.getUsers(filters);
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [getCurrentFilters]);

  // Effect to fetch users when URL params change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Update limit when window size changes
  useEffect(() => {
    const currentFilters = getCurrentFilters();
    const newLimit = getItemsPerPage();
    if (currentFilters.limit !== newLimit) {
      updateFilters({ limit: newLimit, page: 1 });
    }
  }, [windowWidth, getCurrentFilters, getItemsPerPage, updateFilters]);

  const currentFilters = getCurrentFilters();

  const sortOptions = [
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'city', label: 'City' },
    { value: 'occupation', label: 'Occupation' }
  ];

  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;

    const { currentPage, totalPages } = pagination;

    const renderPageButton = (page, isActive = false) => (
      <button
        key={page}
        onClick={() => updateFilters({ page })}
        className={`px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 transition-colors ${
          isActive
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        {page}
      </button>
    );

    const pages = [];

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => updateFilters({ page: currentPage - 1 })}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-l-md transition-colors"
        >
          ‹
        </button>
      );
    }

    // First 3 pages
    for (let i = 1; i <= Math.min(3, totalPages); i++) {
      pages.push(renderPageButton(i, i === currentPage));
    }

    // Middle section with custom input
    if (totalPages > 6) {
      // Add ellipsis if there's a gap
      if (currentPage > 4) {
        pages.push(
          <span key="ellipsis1" className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
            ...
          </span>
        );
      }

      // Custom page input in the middle
      pages.push(
        <input
          key="page-input"
          type="number"
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= totalPages) {
              updateFilters({ page });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.target.blur();
            }
          }}
          min="1"
          max={totalPages}
          className="w-12 px-2 py-1 text-sm text-center border border-gray-300 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      );

      // Add ellipsis if there's a gap
      if (currentPage < totalPages - 3) {
        pages.push(
          <span key="ellipsis2" className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
            ...
          </span>
        );
      }
    }

    // Last 3 pages
    if (totalPages > 3) {
      for (let i = Math.max(totalPages - 2, 4); i <= totalPages; i++) {
        pages.push(renderPageButton(i, i === currentPage));
      }
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => updateFilters({ page: currentPage + 1 })}
          className="px-3 py-1 text-sm border border-l-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-md transition-colors"
        >
          ›
        </button>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4 mt-6">
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {pages}
        </div>
      </div>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <Link
          to="/create-user"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors dark:text-white"
        >
          Add New User
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={currentFilters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Search users..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort By
            </label>
            <select
              value={currentFilters.sortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Order
            </label>
            <select
              value={currentFilters.sortOrder}
              onChange={(e) => updateFilters({ sortOrder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={currentFilters.isActive}
              onChange={(e) => updateFilters({ isActive: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Users</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Additional Filters - Collapsible on mobile */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
            className="flex items-center cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <svg 
              className={`w-4 h-4 mr-1 transition-transform ${moreFiltersOpen ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            More Filters
          </button>
          {moreFiltersOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
              <input
                type="text"
                value={currentFilters.city}
                onChange={(e) => updateFilters({ city: e.target.value })}
                placeholder="Filter by city..."
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={currentFilters.state}
                onChange={(e) => updateFilters({ state: e.target.value })}
                placeholder="Filter by state..."
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={currentFilters.occupation}
                onChange={(e) => updateFilters({ occupation: e.target.value })}
                placeholder="Filter by occupation..."
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Clear Filters */}
        {Object.values(currentFilters).some(value => value && value !== 'firstName' && value !== 'asc' && value !== 1 && value !== getItemsPerPage()) && (
          <button
            onClick={() => setSearchParams({})}
            className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Users Grid */}
      {users?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No users found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users?.map(user => (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group"
              >
                <Link
                  to={`/users/${user.id}`}
                  className="block hover:border-blue-300 dark:hover:border-blue-600"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {user.occupation && (
                      <p className="truncate">{user.occupation}</p>
                    )}
                    {user.city && user.state && (
                      <p className="truncate">{user.city}, {user.state}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </Link>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <Link
                    to={`/edit-user/${user.id}`}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
                        try {
                          await userService.deleteUser(user.id);
                          fetchUsers(); // Refresh the list
                        } catch (err) {
                          setError(err.response?.data?.message || 'Failed to delete user');
                        }
                      }
                    }}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {renderPagination()}
        </>
      )}

      {/* Loading overlay for subsequent requests */}
      {loading && users.length > 0 && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default UserList;