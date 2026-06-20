import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Plus, Trash2, Sprout } from 'lucide-react';
import './Crop.css';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://tanmay-traders.vercel.app';

const Crop = () => {
  const [crops, setCrops] = useState([]);
  const [newCropName, setNewCropName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/crop`);
      const data = await response.json();
      if (data.success) {
        setCrops(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching crops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCrop = async (e) => {
    e.preventDefault();
    if (!newCropName.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/crop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cropName: newCropName.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setCrops([data.data, ...crops]);
        setNewCropName('');
      } else {
        alert(data.message || 'Failed to add crop');
      }
    } catch (error) {
      console.error('Error adding crop:', error);
      alert('Error adding crop');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCrop = async (id) => {
    if (!window.confirm('Are you sure you want to delete this crop?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/crop/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setCrops(crops.filter(c => c._id !== id));
      } else {
        alert(data.message || 'Failed to delete crop');
      }
    } catch (error) {
      console.error('Error deleting crop:', error);
      alert('Error deleting crop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crop-container content-area">
      <div className="crop-header">
        <h2 className="gradient-text flex-row-gap">
          <Sprout size={28} className="text-green" /> Crop Section
        </h2>
        <p className="subtitle">Manage crop names used in Patti and Bill generation</p>
      </div>

      <div className="crop-grid-layout">
        {/* Add Crop Card */}
        <motion.div 
          className="crop-card glass-panel form-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3>Add New Crop</h3>
          <form onSubmit={handleAddCrop} className="add-crop-form">
            <div className="form-group">
              <label>Crop Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Soybean, Cotton, Wheat" 
                value={newCropName}
                onChange={(e) => setNewCropName(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              <Plus size={18} />
              <span>{loading ? 'Adding...' : 'Add Crop'}</span>
            </button>
          </form>
        </motion.div>

        {/* Crop List Card */}
        <motion.div 
          className="crop-card glass-panel list-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3>Existing Crops</h3>
          {loading && crops.length === 0 ? (
            <div className="empty-state">Loading crops...</div>
          ) : crops.length === 0 ? (
            <div className="empty-state">No crops found. Add one on the left.</div>
          ) : (
            <div className="crop-list">
              <AnimatePresence>
                {crops.map((crop) => (
                  <motion.div 
                    key={crop._id} 
                    className="crop-item"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="crop-item-info">
                      <Leaf size={16} className="leaf-icon" />
                      <span>{crop.cropName}</span>
                    </div>
                    <button 
                      className="delete-crop-btn"
                      onClick={() => handleDeleteCrop(crop._id)}
                      title="Delete Crop"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Crop;
