package com.scheduling.repository;

import com.scheduling.model.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    
    Optional<Classroom> findByRoomName(String roomName);
    
    List<Classroom> findByRoomType(String roomType);
    
    List<Classroom> findByCapacityGreaterThanEqual(Integer capacity);
    
    @Query("SELECT c FROM Classroom c WHERE c.capacity >= :minCapacity AND c.roomType = :roomType")
    List<Classroom> findAvailableClassrooms(@Param("minCapacity") Integer minCapacity, 
                                           @Param("roomType") String roomType);
}
