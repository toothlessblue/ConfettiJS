- [ ] preallocate buffer space for more particles to reduce data copy operations when adding particles
    - Use instance count to track where new particle data should be placed
    - Keep track of actual buffer size
    - When adding particles, if buffer isn't big enough, do the whole resizing operation (with extra preallocation on the end)
    - Preallocation size could be configurable
    - If buffer is not maxed out for some period of time, consider reduce operation

- [ ] remove particles based on their buffer data
    - Identify which particles need to be removed
    - move particles (that won't be removed) from the end of the buffer into their space and reduce instance count
    - if there are no particles to replace the removed with, then we must be at the end of the buffer, simply reduce instance count
    - (do not need to write 0's into moved particles because they will be ignored when drawn (lower instance count))

