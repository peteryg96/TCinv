import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('renders the application title', () => {
    render(<App />);
    expect(screen.getByText('Multi-Platform Inventory')).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    render(<App />);
    
    const productsTab = screen.getByText('Products');
    fireEvent.click(productsTab);
    
    expect(screen.getByText('Add Product')).toBeInTheDocument();
  });

  it('displays product list', () => {
    render(<App />);
    
    expect(screen.getByText('Wireless Earbuds')).toBeInTheDocument();
    expect(screen.getByText('Smart Watch')).toBeInTheDocument();
  });

  it('updates stock when input changes', async () => {
    render(<App />);
    
    const stockInputs = screen.getAllByRole('spinbutton');
    const firstStockInput = stockInputs[0];
    
    fireEvent.change(firstStockInput, { target: { value: '75' } });
    
    await waitFor(() => {
      expect(firstStockInput.value).toBe('75');
    });
  });

  it('shows syncing state when sync button is clicked', async () => {
    render(<App />);
    
    const syncButton = screen.getByText('Sync All');
    fireEvent.click(syncButton);
    
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Sync All')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});