// src/__tests__/utils/reconcile.test.js
import { reconcile } from '../../utils/reconcile';

describe('reconcile', () => {
  it('should merge local and remote notes correctly', () => {
    // Sample data
    const localNotes = [
      { id: '1', title: 'Local Note 1', updatedAt: 100 },
      { id: '2', title: 'Local Note 2', updatedAt: 200 },
    ];
    
    const remoteNotes = [
      { id: '1', title: 'Remote Note 1', updatedAt: 150 },
      { id: '3', title: 'Remote Note 3', updatedAt: 300 },
    ];
    
    // Expected result
    const expected = {
      merged: [
        { id: '1', title: 'Remote Note 1', updatedAt: 150 },
        { id: '2', title: 'Local Note 2', updatedAt: 200 },
        { id: '3', title: 'Remote Note 3', updatedAt: 300 },
      ],
      pushUpstream: [
        { id: '2', title: 'Local Note 2', updatedAt: 200 },
      ],
    };
    
    // Call the function
    const result = reconcile(localNotes, remoteNotes);
    
    // Verify the result
    expect(result.merged).toHaveLength(3);
    expect(result.pushUpstream).toHaveLength(1);
    
    // Check that the merged notes contain all notes
    expect(result.merged.find(n => n.id === '1').title).toBe('Remote Note 1');
    expect(result.merged.find(n => n.id === '2').title).toBe('Local Note 2');
    expect(result.merged.find(n => n.id === '3').title).toBe('Remote Note 3');
    
    // Check that the pushUpstream contains only local notes that need to be pushed
    expect(result.pushUpstream[0].id).toBe('2');
  });
  
  it('should prefer newer notes based on updatedAt timestamp', () => {
    // Sample data with different timestamps
    const localNotes = [
      { id: '1', title: 'Local Note 1', updatedAt: 200 }, // Newer
      { id: '2', title: 'Local Note 2', updatedAt: 100 }, // Older
    ];
    
    const remoteNotes = [
      { id: '1', title: 'Remote Note 1', updatedAt: 100 }, // Older
      { id: '2', title: 'Remote Note 2', updatedAt: 200 }, // Newer
    ];
    
    // Call the function
    const result = reconcile(localNotes, remoteNotes);
    
    // Verify the result
    expect(result.merged.find(n => n.id === '1').title).toBe('Local Note 1');
    expect(result.merged.find(n => n.id === '2').title).toBe('Remote Note 2');
    
    // Check that only the newer local note is pushed upstream
    expect(result.pushUpstream).toHaveLength(1);
    expect(result.pushUpstream[0].id).toBe('1');
  });
  
  it('should handle new local notes that do not exist on the server', () => {
    // Sample data
    const localNotes = [
      { id: '1', title: 'Local Note 1', updatedAt: 100 },
      { id: '2', title: 'Local Note 2', updatedAt: 200 }, // New local note
    ];
    
    const remoteNotes = [
      { id: '1', title: 'Remote Note 1', updatedAt: 150 },
    ];
    
    // Call the function
    const result = reconcile(localNotes, remoteNotes);
    
    // Verify the result
    expect(result.merged).toHaveLength(2);
    expect(result.merged.find(n => n.id === '1').title).toBe('Remote Note 1');
    expect(result.merged.find(n => n.id === '2').title).toBe('Local Note 2');
    
    // Check that the new local note is pushed upstream
    expect(result.pushUpstream).toHaveLength(1);
    expect(result.pushUpstream[0].id).toBe('2');
  });
  
  it('should handle new remote notes that do not exist locally', () => {
    // Sample data
    const localNotes = [
      { id: '1', title: 'Local Note 1', updatedAt: 100 },
    ];
    
    const remoteNotes = [
      { id: '1', title: 'Remote Note 1', updatedAt: 150 },
      { id: '3', title: 'Remote Note 3', updatedAt: 300 }, // New remote note
    ];
    
    // Call the function
    const result = reconcile(localNotes, remoteNotes);
    
    // Verify the result
    expect(result.merged).toHaveLength(2);
    expect(result.merged.find(n => n.id === '1').title).toBe('Remote Note 1');
    expect(result.merged.find(n => n.id === '3').title).toBe('Remote Note 3');
    
    // Check that no local notes are pushed upstream
    expect(result.pushUpstream).toHaveLength(0);
  });
  
  it('should handle deleted notes correctly', () => {
    // Sample data
    const localNotes = [
      { id: '1', title: 'Local Note 1', updatedAt: 100 },
      { id: '2', title: 'Local Note 2', updatedAt: 200, deleted: true }, // Deleted locally
    ];
    
    const remoteNotes = [
      { id: '1', title: 'Remote Note 1', updatedAt: 150, deleted: true }, // Deleted on server
      { id: '2', title: 'Remote Note 2', updatedAt: 100 },
    ];
    
    // Call the function
    const result = reconcile(localNotes, remoteNotes);
    
    // Verify the result
    expect(result.merged).toHaveLength(2);
    
    // Check that deleted status is preserved
    expect(result.merged.find(n => n.id === '1').deleted).toBe(true);
    expect(result.merged.find(n => n.id === '2').deleted).toBe(true);
    
    // Check that the locally deleted note is pushed upstream
    expect(result.pushUpstream).toHaveLength(1);
    expect(result.pushUpstream[0].id).toBe('2');
  });
  
  it('should prefer non-deleted notes when timestamps are equal', () => {
    // Sample data
    const localNotes = [
      { id: '1', title: 'Local Note 1', updatedAt: 100 }, // Not deleted
    ];
    
    const remoteNotes = [
      { id: '1', title: 'Remote Note 1', updatedAt: 100, deleted: true }, // Deleted
    ];
    
    // Call the function
    const result = reconcile(localNotes, remoteNotes);
    
    // Verify the result
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].title).toBe('Local Note 1');
    expect(result.merged[0].deleted).toBeUndefined();
    
    // Check that the non-deleted note is pushed upstream
    expect(result.pushUpstream).toHaveLength(1);
    expect(result.pushUpstream[0].id).toBe('1');
  });
  
  it('should handle empty input arrays', () => {
    // Call the function with empty arrays
    const result = reconcile([], []);
    
    // Verify the result
    expect(result.merged).toHaveLength(0);
    expect(result.pushUpstream).toHaveLength(0);
  });
});
